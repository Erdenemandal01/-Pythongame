"""Teach a dragon: evaluate one Python policy at every tick on a classroom map."""
from collections import deque
import contextlib
import io
import json
import traceback


class DragonLessonError(ValueError):
    pass


class DragonOutput(io.StringIO):
    def write(self, chunk):
        if self.tell() + len(chunk) > 5000:
            raise DragonLessonError("Хэвлэсэн текст хэт урт боллоо. Давталт, print() дуудлагаа цөөрүүлээрэй.")
        return super().write(chunk)


def run_dragon(request):
    output = DragonOutput()
    frames = []
    try:
        payload = request["studio"]["payload"]
        rows = payload["map"]["rows"]
        if (not isinstance(rows, list) or len(rows) != 6 or
                any(not isinstance(row, str) or len(row) != 9 or set(row) - set(".#SECD") for row in rows)):
            raise DragonLessonError("9 × 6 нүдтэй газрын зураг сонгоорой.")
        locate = lambda symbol: [(x, y) for y, row in enumerate(rows) for x, tile in enumerate(row) if tile == symbol]
        eggs = set(locate("E"))
        starts, caves = locate("S"), locate("C")
        if len(starts) != 1 or len(caves) != 1 or not eggs:
            raise DragonLessonError("Зурагт нэг эхлэл, нэг агуй, дор хаяж нэг өндөг хэрэгтэй.")
        cave = caves[0]
        case = payload["case"]
        energy, limit = case["energy"], case["turns"]
        if type(energy) is not int or not 0 <= energy <= 6 or type(limit) is not int or not 1 <= limit <= 80:
            raise DragonLessonError("Энерги 0–6, ээлжийн тоо 1–80 байна.")
        where = {"start": starts[0], "egg": min(eggs, key=lambda p: (p[1], p[0])), "cave": cave}
        if case.get("start") not in where:
            raise DragonLessonError("Лууны эхлэх нүдийг сонгоорой.")
        position = where[case["start"]]
        carried, delivered, total = False, 0, len(eggs)
        visits = 0

        def step_toward(targets):
            queue = deque([(position, position)])
            seen = {position}
            while queue:
                cell, first = queue.popleft()
                if cell in targets:
                    return first
                x, y = cell
                for nxt in ((x+1, y), (x, y+1), (x-1, y), (x, y-1)):
                    nx, ny = nxt
                    if nxt in seen or not (0 <= nx < 9 and 0 <= ny < 6) or rows[ny][nx] in "#D":
                        continue
                    seen.add(nxt)
                    queue.append((nxt, nxt if cell == position else first))
            raise DragonLessonError("Зорилгод хүрэх зам алга. «Миний түвшин»-д хад, лууны байрлалыг шалгаарай.")

        def snapshot(turn, action, detail):
            frames.append({"turn": turn, "x": position[0], "y": position[1], "energy": energy,
                           "carrying": carried, "delivered": delivered, "onEgg": position in eggs,
                           "remaining": sorted(eggs), "action": action, "detail": detail})

        def no_input(*args):
            raise DragonLessonError("decide() функц энерги, өндөг, ачааны утгыг параметрээр авна.")

        code = request.get("code", "")
        if not isinstance(code, str) or len(code) > 16000:
            raise DragonLessonError("Кодыг 16 000 тэмдэгтэд багтаагаарай.")
        scope = {"__name__": "__main__", "input": no_input}
        snapshot(0, "", "Луу аялалдаа бэлэн.")
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            exec(compile(code, "dragon.py", "exec"), scope)
            choose = scope.get("decide")
            if not callable(choose):
                raise DragonLessonError("def decide(energy, on_egg, carrying): гэж функцээ тодорхойлоорой.")
            for turn in range(1, limit + 1):
                action = choose(energy, position in eggs, carried)
                if type(action) is not str or action not in ("rest", "search", "take", "home"):
                    raise DragonLessonError('decide() функц "rest", "search", "take", "home" утгаас нэгийг return хийнэ.')
                if action == "rest":
                    old = energy
                    energy = min(6, energy + 3)
                    detail = f"Амрав. Энерги {old} → {energy}."
                elif energy == 0:
                    detail = "Энерги дууссан тул үйлдэл хийж чадсангүй."
                elif action == "take":
                    if carried:
                        detail = "Нэг өндөг тээж байна. Эхлээд агуйд хүргээрэй."
                    elif position not in eggs:
                        detail = "Энэ нүдэнд өндөг алга."
                    else:
                        eggs.remove(position)
                        carried = True
                        energy -= 1
                        detail = "Өндгийг далавчиндаа хавчуулав."
                else:
                    if action == "home":
                        target = {cave}
                    else:
                        target = eggs
                    if not target:
                        detail = "Газарт өндөг үлдсэнгүй."
                    else:
                        nxt = step_toward(target)
                        if nxt != position:
                            position = nxt
                            energy -= 1
                            visits += 1
                            detail = "Агуй руу нэг нүд алхав." if action == "home" else "Өндөг рүү нэг нүд алхав."
                        else:
                            detail = "Агуй дээр ирсэн." if action == "home" else "Өндөг энэ нүдэнд байна."
                        if carried and position == cave:
                            carried = False
                            delivered += 1
                            detail = "Өндгийг агуйд хүргэлээ!"
                snapshot(turn, action, detail)
                if delivered == total:
                    break
        return {"ok": True, "frames": frames, "total": total, "moves": visits, "won": delivered == total,
                "output": output.getvalue(), "error": ""}
    except BaseException as error:
        line = error.lineno if isinstance(error, SyntaxError) else None
        for frame in traceback.extract_tb(error.__traceback__):
            if frame.filename == "dragon.py":
                line = frame.lineno
        message = str(error) if isinstance(error, DragonLessonError) else (
            "Бичиглэлээ шалгаарай. " + error.msg if isinstance(error, SyntaxError) else
            type(error).__name__ + " · " + str(error)[:240])
        return {"ok": False, "frames": frames, "error": (f"{line}-р мөр · " if line else "") + message,
                "output": output.getvalue()}


json.dumps(run_dragon(json.loads(__request_json)), ensure_ascii=False)
