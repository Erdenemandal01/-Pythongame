"""Run classroom Python with measured pot moisture and one water drop per call."""
import ast
import contextlib
import io
import json
import math
import sys


GARDEN_FILE = "greenhouse.py"
GARDEN_STEPS = 400


class GardenError(Exception):
    pass


class GardenLimit(BaseException):
    pass


class GardenConsole(io.StringIO):
    def write(self, text):
        if self.tell() + len(text) > 4096:
            raise GardenLimit("Гаралт хэт урт боллоо. Хэвлэх мөрөө цөөрүүлээрэй.")
        return super().write(text)


def garden_variables(local_vars):
    visible = {}
    for key, value in local_vars.items():
        if key.startswith("_"):
            continue
        kind = type(value)
        if kind is str:
            value = value[:64]
        elif kind is int:
            if value.bit_length() > 52:
                value = "…"
        elif kind is float:
            if not math.isfinite(value):
                value = str(value)
        elif kind is not bool and value is not None:
            continue
        visible[key[:48]] = value
        if len(visible) >= 10:
            break
    return visible


def run_greenhouse(request):
    frames, watered = [], []
    budget = 0
    console = GardenConsole()
    result = {"ok": False, "won": False, "frames": frames, "watered": watered,
              "errorLine": None, "error": ""}
    try:
        readings = request.get("studio", {}).get("payload", {}).get("moisture")
        if (type(readings) is not list or len(readings) not in (3, 5)
                or any(type(value) is not int or not 0 <= value <= 100 for value in readings)):
            raise GardenError("Гурав эсвэл таван савны чийгийг 0–100 хувиар оруулна.")
        code = request.get("code")
        if type(code) is not str or len(code) > 16000:
            raise GardenError("Кодоо 16 000 тэмдэгтэд багтаагаарай.")
        if not code.strip():
            raise GardenError("Эхний мөрөө бичээд ажиллуулаарай.")
        targets = {index for index, value in enumerate(readings) if value <= 30}
        budget = len(targets)
        tree = ast.parse(code, GARDEN_FILE)
        index_loops = {}
        for node in ast.walk(tree):
            if isinstance(node, ast.For) and isinstance(node.iter, ast.Call) and isinstance(node.iter.func, ast.Name):
                target = node.target
                iterator = node.iter
                if (iterator.func.id == "enumerate" and len(iterator.args) == 1
                        and isinstance(iterator.args[0], ast.Name) and iterator.args[0].id == "moisture"
                        and isinstance(target, (ast.Tuple, ast.List))):
                    target = target.elts[0] if target.elts else None
                elif not (iterator.func.id == "range" and any(
                    isinstance(part, ast.Name) and part.id == "moisture" for part in ast.walk(iterator)
                )):
                    continue
                if isinstance(target, ast.Name):
                    for line in range(node.lineno, node.body[-1].end_lineno + 1):
                        index_loops[line] = target.id

        pending = {}
        invalid_action = ""

        class Moisture(list):
            def __getitem__(self, key):
                value = super().__getitem__(key)
                current = pending.get(sys._getframe(1))
                if current is not None and type(key) is int and -len(readings) <= key < len(readings):
                    current["pot"] = key % len(readings)
                return value

        def water(index):
            nonlocal invalid_action
            current = pending.get(sys._getframe(1))
            if type(index) is not int or not 0 <= index < len(readings):
                invalid_action = f"water(i)-д 0–{len(readings) - 1} хоорондох савны индекс өгнө."
            elif index in watered:
                invalid_action = f"{index + 1}-р саванд ус өгсөн байна. Нэг саванд нэг дусал өгнө."
            elif len(watered) >= budget:
                invalid_action = f"Ус дууслаа. Энэ удаа {budget} дусал байна."
            if invalid_action:
                raise GardenError(invalid_action)
            watered.append(index)
            if current is not None:
                current["pot"] = index
                current["added"].append(index)

        def trace(frame, event, arg):
            if frame.f_code.co_filename != GARDEN_FILE:
                return None
            if event in ("line", "return"):
                prior = pending.pop(frame, None)
                if prior:
                    if len(frames) >= GARDEN_STEPS:
                        raise GardenLimit(f"Код {GARDEN_STEPS} алхмаас хэтэрлээ. Давталт хэзээ зогсохыг шалгаарай.")
                    # A line event precedes execution. Close the previous line now,
                    # including its final water calls and its updated loop variable.
                    if prior["pot"] is None and prior["line"] in index_loops:
                        index = frame.f_locals.get(index_loops[prior["line"]])
                        if type(index) is int and 0 <= index < len(readings):
                            prior["pot"] = index
                    frames.append({**prior, "watered": list(watered),
                                   "remaining": budget - len(watered),
                                   "variables": garden_variables(frame.f_locals)})
                if event == "line":
                    pending[frame] = {"line": frame.f_lineno, "pot": None, "added": []}
            return trace

        def no_input(*args):
            raise GardenError("Савны чийгийг moisture жагсаалтаас уншаарай.")

        scope = {"__name__": "__main__", "moisture": Moisture(readings), "water": water, "input": no_input}
        program = compile(tree, GARDEN_FILE, "exec")
        old_trace = sys.gettrace()
        try:
            with contextlib.redirect_stdout(console), contextlib.redirect_stderr(console):
                sys.settrace(trace)
                exec(program, scope)
        finally:
            sys.settrace(old_trace)
            pending.clear()
        if invalid_action:
            raise GardenError(invalid_action)
        extra = sorted(set(watered) - targets)
        missing = sorted(targets - set(watered))
        result["ok"] = True
        result["won"] = not extra and not missing
        if extra:
            index = extra[0]
            result["error"] = f"{index + 1}-р сав {readings[index]}% чийгтэй тул услах шаардлагагүй."
        elif missing:
            index = missing[0]
            result["error"] = f"{index + 1}-р сав {readings[index]}% чийгтэй, ус аваагүй байна."
    except BaseException as error:
        line = error.lineno if isinstance(error, SyntaxError) else None
        tb = error.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == GARDEN_FILE:
                line = tb.tb_lineno
            tb = tb.tb_next
        if isinstance(error, (GardenError, GardenLimit)):
            message = str(error)
        elif isinstance(error, IndentationError):
            message = "Догол мөрөө шалгаарай. Блокийн доторх мөрийг дөрвөн зайгаар эхлүүлээрэй."
        elif isinstance(error, SyntaxError):
            message = "Бичиглэлийн алдаа. Хаалт, хашилт болон хоёр цэгээ шалгаарай."
        else:
            message = f"{type(error).__name__} · {str(error)[:180]}"
        result["errorLine"] = line
        result["error"] = (f"{line}-р мөр · " if line else "") + message
    result["output"] = console.getvalue()
    result["remaining"] = budget - len(watered)
    return result


json.dumps(run_greenhouse(json.loads(__request_json)), ensure_ascii=False)
