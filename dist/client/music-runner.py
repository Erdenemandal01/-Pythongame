"""Translate a child's Python performance to a bounded musical score."""
import ast
import contextlib
import io
import json
import re
import traceback


def music_performance(request):
    events = []
    end = 0

    def append(kind, value, beats):
        nonlocal end
        if (type(beats) not in (int, float) or not 0.25 <= beats <= 4
                or not float(beats * 4).is_integer()):
            raise ValueError("Уртыг 0.25–4 цохилтын хооронд 0.25-ын алхмаар өгнө.")
        ticks = int(beats * 4)
        if len(events) >= 96 or end + ticks > 128:
            raise ValueError("Аялгуу 32 цохилт буюу 96 хүртэлх хэсэгтэй байна. Давталтаа богиносгоорой.")
        events.append({"kind": kind, "value": value, "start": end, "ticks": ticks})
        end += ticks

    def drum(sound, beats=1):
        if sound not in ("kick", "snare", "hat"):
            raise ValueError('Бөмбөрийн авиа "kick", "snare", "hat" гэсэн утгатай.')
        append("drum", sound, beats)

    def play(note, beats=1):
        if not isinstance(note, str) or not re.fullmatch(r"[A-G](?:#)?[3-5]", note):
            raise ValueError('Нотоо "C4", "F#4" шиг бичээрэй. Октав нь 3, 4 эсвэл 5 байна.')
        append("note", note, beats)

    def rest(beats=1):
        append("rest", "", beats)

    class Console(io.StringIO):
        def write(self, text):
            if self.tell() + len(text) > 4096:
                raise ValueError("Хэвлэсэн текст хэт урт боллоо.")
            return super().write(text)

    stream = Console()
    try:
        code = request["code"]
        tree = ast.parse(code, filename="music.py")
        env = {"__name__": "__main__", "drum": drum, "play": play, "rest": rest}
        with contextlib.redirect_stdout(stream), contextlib.redirect_stderr(stream):
            exec(compile(tree, "music.py", "exec"), env)
        if not any(e["kind"] != "rest" for e in events):
            raise ValueError("drum() эсвэл play() ашиглаж дор хаяж нэг авиа оруулаарай.")
        sequence = [e["value"] for e in events]
        flags = {type(n).__name__ for n in ast.walk(tree)}
        exercise = request.get("studio", {}).get("payload", {}).get("exercise", "")
        if exercise == "groove":
            solved = ("For" in flags and sequence == ["kick", "hat", "snare", "hat"] * 2
                      and all(e["ticks"] == 4 for e in events))
        elif exercise == "steps":
            solved = ("For" in flags and "List" in flags
                      and sequence == ["C4", "E4", "G4", "C5", ""]
                      and all(e["ticks"] == 4 for e in events))
        elif exercise == "echo":
            solved = ("FunctionDef" in flags and sequence == ["G4", "E4", "", "G4", "E4", ""]
                      and all(e["ticks"] == 4 for e in events))
        else:
            solved = False
        return {"ok": True, "events": events, "ticks": end, "solved": solved, "output": stream.getvalue()}
    except BaseException as error:
        line = getattr(error, "lineno", None)
        if not line:
            line = next((f.lineno for f in reversed(traceback.extract_tb(error.__traceback__))
                         if f.filename == "music.py"), None)
        message = str(error)
        if isinstance(error, SyntaxError):
            message = "Хашилт, хаалт, хоёр цэг болон догол мөрөө шалгаарай. " + error.msg
        if isinstance(error, NameError):
            message = "Команд эсвэл хувьсагчийн нэрээ шалгаарай. " + message
        return {"ok": False, "error": (f"{line}-р мөр · " if line else "") + message}


json.dumps(music_performance(json.loads(__request_json)), ensure_ascii=False)
