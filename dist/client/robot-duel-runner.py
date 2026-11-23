"""Run a learner's Python policy on the training course or the three duel boards."""
import contextlib
import io
import json
import sys


ROBOT_SCRIPT = "robot.py"
ROBOT_TURNS = 40
ROBOT_DIRECTIONS = ((1, 0), (0, 1), (-1, 0), (0, -1))


class RobotError(ValueError):
    pass


class RobotLimit(BaseException):
    pass


class RobotConsole(io.StringIO):
    def write(self, message):
        if self.tell() + len(message) > 4096:
            raise RobotLimit("Гаралт хэт урт боллоо. print() дуудлагаа цөөрүүлээрэй.")
        return super().write(message)


def robot_board(spec, result, program):
    rows = spec["rows"]
    if (not isinstance(rows, list) or not 1 <= len(rows) <= 12
            or not isinstance(rows[0], str) or not 1 <= len(rows[0]) <= 12
            or any(type(row) is not str or len(row) != len(rows[0]) or set(row) - set(".#G") for row in rows)
            or rows[0][0] == "#"):
        raise RobotError("Роботын газрын зураг буруу байна.")
    remaining = {(x, y) for y, row in enumerate(rows) for x, tile in enumerate(row) if tile == "G"}
    if not remaining:
        raise RobotError("Газрын зурагт эрдэнэс хэрэгтэй.")

    board = {"title": spec["title"], "rows": rows, "totalGems": len(remaining), "gems": 0,
             "frames": [], "actions": [], "won": False, "reason": ""}
    result["boards"].append(board)
    x = y = direction = 0

    def snapshot(action):
        dx, dy = ROBOT_DIRECTIONS[direction]
        nx, ny = x + dx, y + dy
        wall = not (0 <= ny < len(rows) and 0 <= nx < len(rows[0])) or rows[ny][nx] == "#"
        frame = {"x": x, "y": y, "dir": direction, "action": action,
                 "remaining": sorted(remaining, key=lambda g: (g[1], g[0])),
                 "wallAhead": wall, "onGem": (x, y) in remaining}
        board["frames"].append(frame)
        return frame

    def no_input(*args):
        raise RobotError("Робот мэдрэгчийн утгаа decide(on_gem, wall_ahead) функцээр авна.")

    frame = snapshot(None)
    # Each board starts independently, including learner-defined lists and counters.
    scope = {"__name__": "__main__", "input": no_input}
    exec(program, scope)
    decide = scope.get("decide")
    if not callable(decide):
        raise RobotError("def decide(on_gem, wall_ahead): гэж функцээ бичээрэй.")
    for turn in range(ROBOT_TURNS):
        action = decide(frame["onGem"], frame["wallAhead"])
        if type(action) is not str or action not in ("move", "right", "collect"):
            raise RobotError('decide() функц "move", "right", "collect" утгаас нэгийг return хийнэ.')
        board["actions"].append(action)
        if action == "move":
            if frame["wallAhead"]:
                board["reason"] = "Робот хана мөргөлөө. wall_ahead үнэн үед эргэх дүрмээ шалгаарай."
            else:
                dx, dy = ROBOT_DIRECTIONS[direction]
                x, y = x + dx, y + dy
        elif action == "right":
            direction = (direction + 1) % 4
        elif frame["onGem"]:
            remaining.remove((x, y))
            board["gems"] += 1
        else:
            board["reason"] = "Энэ нүдэнд эрдэнэс алга. on_gem үнэн үед эрдэнэсээ аваарай."
        frame = snapshot(action)
        if not remaining:
            board["won"] = True
            board["reason"] = "Бүх эрдэнэсийг цуглууллаа!"
        if board["reason"]:
            break
    else:
        board["reason"] = "40 алхам дууслаа. Робот аль нүдэн дээр дахин дахин ирснийг хараарай."


def run_robot_duel(request):
    console = RobotConsole()
    result = {"ok": False, "boards": [], "error": "", "errorLine": None}
    last_line = None
    visits = 0

    def trace(frame, event, arg):
        nonlocal visits, last_line
        if frame.f_code.co_filename != ROBOT_SCRIPT:
            return None
        if event == "line":
            last_line = frame.f_lineno
            visits += 1
            if visits > 12000:
                raise RobotLimit("Давталт удаан ажиллаж байна. decide() хэзээ утга буцаахыг шалгаарай.")
        return trace

    try:
        code = request.get("code")
        if type(code) is not str or not code.strip():
            raise RobotError("Эхлээд роботын дүрмээ Python-оор бичээрэй.")
        if len(code) > 16000:
            raise RobotError("Кодоо 16 000 тэмдэгтэд багтаагаарай.")
        specs = request["studio"]["payload"]["boards"]
        if not isinstance(specs, list) or len(specs) not in (1, 3):
            raise RobotError("Дасгалын нэг зам эсвэл сорилын гурван зам сонгоорой.")
        program = compile(code, ROBOT_SCRIPT, "exec")
        previous = sys.gettrace()
        try:
            with contextlib.redirect_stdout(console), contextlib.redirect_stderr(console):
                sys.settrace(trace)
                for spec in specs:
                    last_line = None
                    robot_board(spec, result, program)
        finally:
            sys.settrace(previous)
        result["ok"] = True
    except BaseException as error:
        line = error.lineno if isinstance(error, SyntaxError) else last_line
        tb = error.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == ROBOT_SCRIPT:
                line = tb.tb_lineno
            tb = tb.tb_next
        if isinstance(error, IndentationError):
            message = "Догол мөрөө шалгаарай. if эсвэл def-ийн дараах мөрийг дөрвөн зайгаар доголлоорой."
        elif isinstance(error, SyntaxError):
            message = "Python бичиглэлийн алдаа. Хаалт, хашилт болон хоёр цэгээ шалгаарай."
        elif isinstance(error, (RobotError, RobotLimit)):
            message = str(error)
        else:
            message = f"{type(error).__name__} · {str(error)[:200]}"
        result["errorLine"] = line
        result["error"] = (f"{line}-р мөр · " if line else "") + message
    result["solved"] = sum(b["won"] for b in result["boards"])
    result["gems"] = sum(b["gems"] for b in result["boards"])
    result["output"] = console.getvalue()
    return result


json.dumps(run_robot_duel(json.loads(__request_json)), ensure_ascii=False)
