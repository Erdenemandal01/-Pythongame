"""Run the robot's program on a chosen input, then check the learner's repair."""
import contextlib
import io
import json
import traceback


class CaseOutput(io.StringIO):
    def write(self, text):
        if self.tell() + len(text) > 3000:
            raise ValueError("Гаралт урт байна. Давталт, хэвлэх мөрөө шалгаарай.")
        return super().write(text)


def charged(cells):
    return sum(1 for cell in cells if cell > 0)


def route(energy, storm):
    if storm:
        return "shelter"
    if energy < 3:
        return "charge"
    return "walk"


CASES = {
    "door": ("opens", lambda crystals: crystals >= 3, [(n,) for n in [0, 1, 2, 3, 4, 7, 12]]),
    "beacon": ("flash", lambda tick: tick > 0 and tick % 4 == 0, [(n,) for n in [0, 1, 3, 4, 5, 8, 12, 16, 17]]),
    "relay": ("accept", lambda word: word.strip().lower() == "north",
              [(x,) for x in ["north", "NORTH", " north", "North  ", "northwest", "south", "", "  NoRtH "]]),
    "battery": ("count_ready", charged, [(x,) for x in [[], [0], [1], [0, 2], [4, 0, 2], [0, 0, 0], [1, 2, 1]]]),
    "storm": ("choose", route, [(n, s) for n in [0, 1, 2, 3, 5, 9] for s in [False, True]]),
}


def detective_run(req):
    data = req["studio"]["payload"]
    name, reference, samples = CASES[data["case"]]
    args = data["args"]
    source = req["code"]
    if not isinstance(source, str) or len(source) > 16000:
        return {"ok": False, "error": "Програм 16 000 тэмдэгтээс богино байх ёстой."}
    output = CaseOutput()
    try:
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            space = {"__name__": "__main__"}
            exec(compile(source, "robot.py", "exec"), space)
            fn = space.get(name)
            if not callable(fn):
                raise ValueError(f"{name} нэртэй функц хэрэгтэй.")
            # A student function may change a list. Give each test a fresh copy.
            def test(inputs):
                expected = reference(*inputs)
                actual = fn(*json.loads(json.dumps(inputs)))
                matches = type(actual) is type(expected) and actual == expected
                if type(actual) not in (str, int, float, bool, type(None)):
                    actual = type(actual).__name__
                if type(actual) is int and actual.bit_length() > 256:
                    actual = "Маш том бүхэл тоо"
                if type(actual) is float:
                    actual = repr(actual)
                return {"args": inputs, "expected": expected,
                        "actual": actual[:100] if isinstance(actual, str) else actual, "matches": matches}
            sample = test(args)
            results = [sample]
            if data.get("verify"):
                seen = [args]
                candidates = ([data["evidence"]] if data.get("evidence") is not None else []) + list(samples)
                for values in candidates:
                    if list(values) not in seen:
                        seen.append(list(values))
                        results.append(test(values))
    except BaseException as error:
        line = error.lineno if isinstance(error, SyntaxError) else None
        for frame in traceback.extract_tb(error.__traceback__):
            if frame.filename == "robot.py":
                line = frame.lineno
        return {"ok": False, "error": (f"{line}-р мөр · " if line else "") + type(error).__name__ + " · " + str(error)[:250]}
    return {"ok": True, "sample": sample, "count": len(results),
            "passed": sum(item["matches"] for item in results),
            "failure": next((item for item in results if not item["matches"]), None)}


json.dumps(detective_run(json.loads(__request_json)), ensure_ascii=False)
