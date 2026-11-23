"""Run one egg-rescue program and capture replayable, post-line Python states."""
import contextlib
import io
import itertools
import json
import sys


LEVEL_SOURCE = "rescue.py"
MAX_STEPS = 600
MAX_OUTPUT = 4096
DIRECTIONS = {"right": (1, 0), "left": (-1, 0), "up": (0, -1), "down": (0, 1)}
TILE_NAMES = {"S": "path", ".": "path", "#": "rock", "C": "cave", "D": "dragon"}


class LevelError(Exception):
    pass


class ReplayLimit(BaseException):
    pass


class LevelConsole(io.StringIO):
    def write(self, text):
        if self.tell() + len(text) > MAX_OUTPUT:
            raise ReplayLimit("Гаралт хэт урт боллоо. Хэвлэх мөр эсвэл давталтаа цөөрүүлээрэй.")
        return super().write(text)


def short_value(value, depth=0):
    """Display ordinary data without invoking user-defined display methods."""
    kind = type(value)
    if value is None or kind in (bool, float):
        return repr(value)
    if kind is int:
        return repr(value) if value.bit_length() < 256 else "…"
    if kind is str:
        return repr(value[:48] + ("…" if len(value) > 48 else ""))
    if kind not in (tuple, list, dict, set):
        return None
    if depth == 2:
        return "…"
    if kind is dict:
        sample = [
            (short_value(key, depth + 1) or "…") + ": " + (short_value(item, depth + 1) or "…")
            for key, item in itertools.islice(value.items(), 4)
        ]
        left, right = "{", "}"
    else:
        sample = [(short_value(item, depth + 1) or "…") for item in itertools.islice(value, 4)]
        left, right = {list: ("[", "]"), tuple: ("(", ")"), set: ("{", "}")}[kind]
    if len(value) > 4:
        sample.append("…")
    if kind is tuple and len(value) == 1:
        sample[0] += ","
    return (left + ", ".join(sample) + right)[:120]


def run_level(request):
    frames = []
    console = LevelConsole()
    result = {"ok": False, "won": False, "error": "", "errorLine": None,
              "message": "", "frames": frames, "output": ""}
    try:
        rows = request["level"]["rows"]
        if (not isinstance(rows, list) or len(rows) != 6 or
                any(not isinstance(row, str) or len(row) != 9 for row in rows)):
            raise LevelError("Газрын зураг 9 × 6 нүдтэй байна.")
        cells = "".join(rows)
        if (any(symbol not in ".#SECD" for symbol in cells) or
                cells.count("S") != 1 or cells.count("C") != 1 or "E" not in cells):
            raise LevelError("Эхлэл, агуй тус бүр нэг, мөн дор хаяж нэг өндөг байрлуулаарай.")
        code = request["code"]
        if not isinstance(code, str) or len(code) > 20000:
            raise LevelError("Кодоо 20 000 тэмдэгтэд багтаагаарай.")
        if not code.strip():
            raise LevelError("Эхний командаа бичээд ажиллуулаарай.")
    except (KeyError, TypeError, LevelError) as error:
        result["error"] = str(error) if isinstance(error, LevelError) else "Түвшний мэдээллийг уншиж чадсангүй."
        result["message"] = result["error"]
        return result

    y, x = divmod(cells.index("S"), 9)
    remaining = {(i % 9, i // 9) for i, tile in enumerate(cells) if tile == "E"}
    egg_total = len(remaining)
    awake = False
    actions = []
    pending = {}
    output_offset = 0

    def destination(direction):
        if type(direction) is not str or direction not in DIRECTIONS:
            raise LevelError('Чиглэлээ "right", "left", "up", "down" утгаас сонгоорой.')
        dx, dy = DIRECTIONS[direction]
        return x + dx, y + dy

    def cell_at(px, py):
        if not (0 <= px < 9 and 0 <= py < 6):
            return "edge"
        if (px, py) in remaining:
            return "egg"
        return TILE_NAMES.get(rows[py][px], "path")

    def move(direction):
        nonlocal x, y, awake
        nx, ny = destination(direction)
        cell = cell_at(nx, ny)
        if awake or cell == "dragon":
            if not awake:
                x, y = nx, ny
            awake = True
            raise LevelError("Луу сэрлээ! Өөр зам сонгоод дахин оролдоорой.")
        if cell == "rock":
            raise LevelError("Хад зам хаалаа. Чиглэлээ өөрчлөөрэй.")
        if cell == "edge":
            raise LevelError("Газрын зургийн захаас гарах гэж байна. Чиглэлээ шалгаарай.")
        x, y = nx, ny
        actions.append({"right": "Баруун тийш алхав.", "left": "Зүүн тийш алхав.",
                        "up": "Дээш алхав.", "down": "Доош алхав."}[direction])

    def collect():
        if awake:
            raise LevelError("Луу сэрсэн байна. Дахин эхлүүлээрэй.")
        if (x, y) not in remaining:
            raise LevelError("Энэ нүдэнд өндөг алга. Өндөг дээр очоод collect() гэж бичээрэй.")
        remaining.remove((x, y))
        actions.append("Өндөг авлаа!")

    def eggs():
        return egg_total - len(remaining)

    def ahead(direction):
        return cell_at(*destination(direction))

    def no_input(*_):
        raise LevelError("Энд шийдвэрээ ahead() эсвэл eggs() ашиглан кодлоорой.")

    def capture(line, local_vars):
        nonlocal output_offset
        if len(frames) >= MAX_STEPS:
            raise ReplayLimit(f"Код {MAX_STEPS} алхмаас давлаа. Давталтынхаа төгсөх нөхцөлийг шалгаарай.")
        visible = {}
        for key, value in local_vars.items():
            if key.startswith("_"):
                continue
            display = short_value(value)
            if display is not None:
                visible[key[:48]] = display
            if len(visible) >= 10:
                break
        frame = {"line": line, "x": x, "y": y, "held": eggs(),
                 "remaining": sorted(remaining), "locals": visible, "event": " ".join(actions[:4])}
        actions.clear()
        if console.tell() != output_offset:
            frame["output"] = console.getvalue()[output_offset:]
            output_offset = console.tell()
        frames.append(frame)

    def trace(frame, event, arg):
        if frame.f_code.co_filename != LEVEL_SOURCE:
            return None
        if event in ("line", "return"):
            old = pending.pop(frame, None)
            if old is not None:
                capture(old, frame.f_locals)
            if event == "line":
                pending[frame] = frame.f_lineno
        return trace

    namespace = {"__name__": "__main__", "move": move, "collect": collect,
                 "eggs": eggs, "ahead": ahead, "input": no_input}
    try:
        program = compile(code, LEVEL_SOURCE, "exec")
        previous_trace = sys.gettrace()
        try:
            with contextlib.redirect_stdout(console), contextlib.redirect_stderr(console):
                sys.settrace(trace)
                exec(program, namespace)
        finally:
            sys.settrace(previous_trace)
        if awake:
            raise LevelError("Луу сэрлээ! Өөр зам сонгоод дахин оролдоорой.")
    except BaseException as error:
        tb = error.__traceback__
        line = getattr(error, "lineno", None) if isinstance(error, SyntaxError) else None
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == LEVEL_SOURCE:
                line = tb.tb_lineno
            tb = tb.tb_next
        if isinstance(error, (LevelError, ReplayLimit)):
            message = str(error)
        elif isinstance(error, IndentationError):
            message = "Догол мөрийг шалгаарай. Блок дотор мөр бүрийг дөрвөн зайгаар эхлүүлээрэй."
        elif isinstance(error, SyntaxError):
            message = "Бичиглэлийн алдаа. Хашилт, хаалт болон хоёр цэгээ шалгаарай."
        else:
            message = f"{type(error).__name__}: {str(error)[:250]}"
        result["errorLine"] = line
        result["error"] = (f"{line}-р мөр · " if line else "") + message
        result["message"] = result["error"]
        if line and len(frames) < MAX_STEPS:
            # Remove caller-unwind events after the innermost failing line.
            last = next((i for i in range(len(frames)-1, -1, -1) if frames[i]["line"] == line), None)
            if last is not None:
                del frames[last+1:]
            else:
                capture(line, namespace)
            frames[-1]["event"] = message
    else:
        result["ok"] = True
        result["won"] = not remaining and cell_at(x, y) == "cave"
        result["message"] = ("Бүх өндгөө агуйд хүргэлээ!" if result["won"] else
                             f"{len(remaining)} өндөг үлдлээ. Өндөг бүр дээр очоод collect() дуудаарай."
                             if remaining else "Бүх өндгөө авлаа. Одоо агуйд хүргээрэй.")
    finally:
        pending.clear()
    result["output"] = console.getvalue()
    return result


json.dumps(run_level(json.loads(__request_json)), ensure_ascii=False)
