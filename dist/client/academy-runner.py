"""Run a classroom submission, then assess it separately from its console output."""
import contextlib
import io
import json
import math
import re
import traceback


class ClassroomOutput(io.StringIO):
    def write(self, text):
        if self.tell() + len(text) > 20000:
            raise ValueError("Гаралт хэт урт байна. Давталтын тоогоо багасгаарай.")
        return super().write(text)


def report_matches(output, values):
    """Each row ends with its assigned value; a descriptive label is optional."""
    rows = output.splitlines()
    if len(rows) != len(values):
        return False
    for row, value in zip(rows, values):
        row = row.strip()
        text = str(value)
        if row == text:
            continue
        if not row.endswith(text):
            return False
        label = row[:-len(text)]
        if not label or not (label[-1].isspace() or label[-1] in ":=："):
            return False
        if not any(char.isalpha() for char in label):
            return False
        if isinstance(value, int) and any(char.isdigit() for char in label):
            return False
    return True


def explain_error(error):
    message = "".join(traceback.format_exception_only(type(error), error)).strip()
    if isinstance(error, SyntaxError):
        line = error.lineno
    else:
        frames = traceback.extract_tb(error.__traceback__)
        line = next((frame.lineno for frame in reversed(frames) if frame.filename == "studio.py"), None)
    hints = (
        (IndentationError, "Блок доторх мөрүүдийг ижил тооны зайгаар догол мөр болгоорой."),
        (SyntaxError, "Энэ мөр болон өмнөх мөрийн хаалт, хашилт, хоёр цэгийг шалгаарай."),
        (NameError, "Хувьсагчийн нэрийг анх утга оноосон мөртэй нь тулгаарай."),
        (IndexError, "Жагсаалтын эхний нүд 0. Сүүлийн нүдний дугаар нь уртаас нэгээр бага."),
        (KeyError, "Хайсан түлхүүр толь бичигт байгаа эсэхийг шалгаарай."),
        (TypeError, "Энэ үйлдэлд өгсөн утгууд тоо, текст эсвэл жагсаалтын аль нь болохыг шалгаарай."),
        (ZeroDivisionError, "Хуваагчийн утга яагаад тэг болсныг шалгаарай."),
    )
    hint = next((text for category, text in hints if isinstance(error, category)), "")
    return (f"{line}-р мөр · " if line else "") + message + ("\n" + hint if hint else "")


def assess_lesson(request):
    settings = request["academy"]
    stream = ClassroomOutput()
    variables = {"__name__": "__main__"}

    def missing_input(*_):
        raise ValueError("Энэ дасгалд оролтын утгаа хувьсагчид бичээрэй.")

    replies = iter(settings.get("stdin", "").splitlines())

    def classroom_input(prompt=""):
        try:
            value = next(replies)
        except StopIteration:
            raise EOFError("«Гараас утга оруулах» хэсэгт энэ асуултын хариуг дараагийн мөрөнд бичээрэй.") from None
        print(str(prompt) + value)
        return value

    variables["input"] = classroom_input if "stdin" in settings else missing_input
    artwork = []
    mode = settings.get("maker")

    def coordinate(x, y):
        if type(x) is not int or type(y) is not int or not (0 <= x < 12 and 0 <= y < 8):
            raise ValueError("x нь 0–11, y нь 0–7 хоорондох бүхэл тоо байна.")

    def add(mark):
        if len(artwork) >= 512:
            raise ValueError("Нэг зурагт 512 хүртэлх дүрслэх команд хэрэглээрэй.")
        artwork.append(mark)

    def tile(x, y, kind):
        coordinate(x, y)
        if kind not in ("grass", "water", "tree", "flower", "rock", "dragon"):
            raise ValueError("Нүдний төрөл: grass, water, tree, flower, rock, dragon.")
        add({"x": x, "y": y, "kind": kind})

    def dot(x, y, color):
        coordinate(x, y)
        colors = ("red", "blue", "green", "yellow", "purple", "pink", "orange", "white",
                  "black", "gold", "teal", "cyan", "magenta", "lime", "brown", "gray", "navy")
        if not isinstance(color, str) or not (re.fullmatch(r"#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}", color) or color.lower() in colors):
            raise ValueError("Өнгийг red, gold эсвэл #ffbb00 хэлбэрээр бичээрэй.")
        add({"x": x, "y": y, "color": color})

    def bar(label, value):
        if len(artwork) >= 24:
            raise ValueError("Нэг диаграмд 24 хүртэлх багана зурна.")
        if type(value) not in (int, float) or not math.isfinite(value) or not 0 <= value <= 100:
            raise ValueError("Баганын утга 0–100 хооронд байна.")
        add({"label": str(label)[:48], "value": value})

    if mode == "garden":
        variables["tile"] = tile
    elif mode == "pixel":
        variables["dot"] = dot
    elif mode == "bars":
        variables["bar"] = bar
    try:
        with contextlib.redirect_stdout(stream):
            exec(compile(request["code"], "studio.py", "exec"), variables)
    except BaseException as error:
        result = {"ok": False, "kind": "code", "error": explain_error(error)}
    else:
        result = {"ok": True, "kind": "success"}
        lamps = settings.get("lanterns")
        if isinstance(lamps, list) and 0 < len(lamps) <= 6:
            # Use the pupil's return value even when the later assessment fails.
            try:
                with contextlib.redirect_stdout(ClassroomOutput()):
                    messages = variables["light_street"](lamps.copy())
                if isinstance(messages, list):
                    artwork = [name + " аслаа" in messages or name + " lit up" in messages for name in lamps]
            except Exception:
                pass
        try:
            if not settings.get("sandbox"):
                environment = {"g": variables, "out": stream.getvalue().strip(),
                               "contextlib": contextlib, "io": io, "report_matches": report_matches}
                checker = environment.copy()
                with contextlib.redirect_stdout(ClassroomOutput()):
                    try:
                        exec(settings["check"], checker)
                    except Exception as original_error:
                        alternative = settings.get("checkAlternative")
                        if not alternative:
                            raise
                        try:
                            exec(alternative, environment.copy())
                        except Exception:
                            raise original_error
        except BaseException as error:
            message = str(error)
            if settings.get("checkHint") and isinstance(error, AssertionError):
                if "wanted" in checker and "actual" in checker and "args" in checker:
                    message = f"Input {checker['args']!r}: expected {checker['wanted']!r}, got {checker['actual']!r}."
                elif "case_inputs" in checker and "actual" in checker:
                    message = f"For input {checker['case_inputs']!r}, your function returned {checker['actual']!r}. " + settings["checkHint"]
                else:
                    message = "Check your result. " + settings["checkHint"]
            result = {"ok": False, "kind": "test",
                      "error": message or "Нөхцөлийн нэг нь биелсэнгүй. Даалгаврын жишээ болон захын утгуудаа шалгаарай."}
    result["output"] = stream.getvalue()
    if mode:
        result["preview"] = artwork
    elif "lanterns" in settings:
        result["lanterns"] = artwork
    return json.dumps(result, ensure_ascii=False)


assess_lesson(json.loads(__request_json))
