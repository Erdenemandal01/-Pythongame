"""Evaluate three small, isolated city functions and simulate one shared clock."""
import ast
import json


def simulate_city(raw):
    payload = raw.get("studio", {}).get("payload", {})
    roles = ("signal", "bus", "lamps")
    titles = {"signal": "Гэрлэн дохио", "bus": "Автобус", "lamps": "Гудамжны гэрэл"}
    baseline = {
        "signal": 'def signal(tick):\n    return "red" if tick % 4 < 2 else "green"',
        "bus": 'def bus(signal, crossing, waiting):\n    if crossing and signal == "red":\n        return "wait"\n    return "board" if waiting else "go"',
        "lamps": "def lamps(hour):\n    return hour >= 18 or hour < 6",
    }
    role = payload.get("role")
    if role not in (*roles, "combined"):
        return {"ok": False, "error": "Хотын багийн үүргээ сонгоорой."}
    codes = dict(baseline)
    if role == "combined":
        imported = payload.get("codes")
        if not isinstance(imported, dict) or any(key not in imported for key in roles):
            return {"ok": False, "error": "Гурван багийн бүтээлийг бүрдүүлээрэй."}
        codes = {k: imported[k] for k in roles}
    else:
        codes[role] = raw.get("code")
    # Shared projects describe pure decisions. Only a function call made by the
    # simulation may run a student's statements.
    syntax = (ast.Module, ast.FunctionDef, ast.arguments, ast.arg, ast.Return,
              ast.If, ast.IfExp, ast.Name, ast.Load, ast.Store, ast.Constant,
              ast.Compare, ast.BoolOp, ast.And, ast.Or, ast.UnaryOp, ast.Not,
              ast.UAdd, ast.USub, ast.BinOp, ast.Add, ast.Sub, ast.Mult, ast.Div,
              ast.FloorDiv, ast.Mod, ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt,
              ast.GtE, ast.In, ast.NotIn, ast.Is, ast.IsNot, ast.Tuple, ast.List,
              ast.Dict, ast.Subscript, ast.Slice, ast.Assign, ast.AugAssign, ast.For,
              ast.Pass, ast.Break, ast.Continue, ast.Call, ast.Expr, ast.keyword)
    builtins = {"min": min, "max": max, "abs": abs, "len": len, "range": range,
                "sum": sum, "int": int, "bool": bool, "round": round}
    current = role
    checks = []
    frames = []

    def assemble(name):
        source = codes[name]
        if not isinstance(source, str) or len(source) > 6000 or not source.strip():
            raise ValueError("Функцээ 1–6000 тэмдэгтэд багтааж бичээрэй.")
        tree = ast.parse(source, filename=name + ".py")
        if any(not isinstance(item, ast.FunctionDef) for item in tree.body):
            raise ValueError("Командуудаа def функц дотор догол мөрөөр бичээрэй.")
        for item in ast.walk(tree):
            if not isinstance(item, syntax) or isinstance(item, ast.Name) and item.id.startswith("_"):
                raise ValueError("Хотын дүрэмд хувьсагч, нөхцөл, давталт болон энгийн функц ашиглаарай.")
            if isinstance(item, ast.FunctionDef) and (item.decorator_list or item.args.defaults or
                    item.args.kw_defaults or item.returns or item.name.startswith("_")):
                raise ValueError("Функцээ жишээний адил нэр, үндсэн параметртэй бичээрэй.")
            if isinstance(item, ast.arg) and item.annotation is not None:
                raise ValueError("Параметрт зөвхөн нэр бичээрэй.")
        space = {"__builtins__": builtins.copy()}
        exec(compile(tree, name + ".py", "exec"), space)
        if not callable(space.get(name)):
            raise ValueError(f"{name} нэртэй функцээ тодорхойлоорой.")
        return space[name]

    def call(name, *args):
        nonlocal current
        current = name
        val = functions[name](*args)
        if name == "lamps":
            if type(val) is not bool:
                raise ValueError("lamps(hour) функц True эсвэл False буцаана.")
        elif name == "signal":
            if type(val) is not str or val not in ("red", "green"):
                raise ValueError('signal(tick) функц "red" эсвэл "green" буцаана.')
        elif type(val) is not str or val not in ("go", "wait", "board"):
            raise ValueError('bus(...) функц "go", "wait", "board" утгаас нэгийг буцаана.')
        return val

    def add(name, description, passed):
        checks.append({"role": name, "label": description, "pass": bool(passed)})

    try:
        functions = {}
        for name in roles:
            current = name
            functions[name] = assemble(name)
        for name in roles if role == "combined" else (role,):
            if name == "signal":
                first = [call(name, i) for i in range(12)]
                add(name, "Эхний 12 мөчид улаан асна", "red" in first)
                add(name, "Эхний 12 мөчид ногоон асна", "green" in first)
            elif name == "bus":
                add(name, "Улаан уулзварт хүлээнэ", call(name, "red", True, False) == "wait")
                add(name, "Ногоон уулзвараар явна", call(name, "green", True, False) == "go")
                add(name, "Буудалд зорчигч суулгана", call(name, "red", False, True) == "board")
                add(name, "Чөлөөтэй замд явна", call(name, "red", False, False) == "go")
            else:
                add(name, "Үдэд гэрэл унтарна", not call(name, 12))
                add(name, "Оройн 21 цагт гэрэл асна", call(name, 21))
                add(name, "Үүрийн 03 цагт гэрэл асна", call(name, 3))
        pos, riders, boarded = 0, 0, False
        for tick in range(24):
            hour = (16 + tick) % 24
            signal = call("signal", tick)
            lamps = call("lamps", hour)
            crossing = pos in (3, 9)
            waiting = pos in (1, 7) and not boarded
            action = call("bus", signal, crossing, waiting)
            if action == "go" and crossing and signal == "red":
                outcome = "blocked"
            elif action == "go":
                pos, boarded, outcome = (pos + 1) % 12, False, "go"
            elif action == "board" and waiting:
                riders, boarded, outcome = riders + 1, True, "board"
            elif action == "board":
                outcome = "empty"
            else:
                outcome = "wait"
            frames.append({"tick": tick, "hour": hour, "pos": pos, "signal": signal,
                           "lamps": lamps, "action": outcome, "riders": riders})
    except Exception as exc:
        line = getattr(exc, "lineno", None)
        tb = exc.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == current + ".py":
                line = tb.tb_lineno
            tb = tb.tb_next
        where = f" · {line}-р мөр" if line else ""
        message = str(exc)
        if isinstance(exc, SyntaxError):
            message = "Бичиглэл, хаалт, хоёр цэг болон догол мөрөө шалгаарай."
        return {"ok": False, "error": f"{titles.get(current, 'Хот')}{where} · {message[:200]}"}
    return {"ok": True, "passed": all(c["pass"] for c in checks), "checks": checks, "frames": frames}


json.dumps(simulate_city(json.loads(__request_json)), ensure_ascii=False)
