"""Execute one learner program against a fresh deterministic encounter."""
import json
import traceback


def run_battle(raw):
    request = json.loads(raw)
    encounter = request["battle"]
    pattern = encounter["patterns"]
    second_phase = encounter.get("secondPhase")
    phase = 1
    phase_start = 0
    max_hp = encounter["playerHP"]
    limit = encounter["maxTurns"]
    player_hp = max_hp
    enemy_hp = encounter["hp"]
    potions = encounter["potions"]
    charged = False
    history = []

    def intent_at(turn_index):
        return pattern[(turn_index - phase_start) % len(pattern)]

    def sense():
        return intent_at(len(history))

    def alive():
        return player_hp > 0 and enemy_hp > 0 and len(history) < limit

    def act(action):
        nonlocal player_hp, enemy_hp, potions, charged, phase, phase_start, pattern
        if not alive():
            return
        intent = sense()
        previous_player = player_hp
        previous_enemy = enemy_hp
        healing = 0
        detail = []

        if action == "strike":
            if intent == "shield":
                player_hp = max(0, player_hp - 1)
                detail.append("Цохилт хуягнаас ойв. Та 1 амь алдлаа.")
            else:
                damage = 5 if charged else 3
                enemy_hp = max(0, enemy_hp - damage)
                detail.append(f"Цохилтоор {previous_enemy - enemy_hp} амь хаслаа.")
                charged = False
        elif action == "heal":
            if not potions:
                raise ValueError("Эмчилгээний ундаа дууссан. potions_left() утгаа шалгаарай.")
            potions -= 1
            healing = min(6, max_hp - player_hp)
            player_hp += healing
            detail.append(f"Ундаа ууж {healing} амь нөхлөө.")
        else:
            detail.append("Бамбайгаа өргөлөө.")

        if not enemy_hp:
            detail.append("Дайсан бууж өглөө!")
        elif action == "guard" and intent in ("hit", "charge"):
            charged = True
            detail.append("Дайралтыг хаалаа. Дараагийн цохилт 5 хүчтэй.")
        elif intent in ("hit", "charge", "hex"):
            damage = encounter.get(intent + "Damage", {"hit": 2, "charge": 7, "hex": 4}[intent])
            taken = min(player_hp, damage)
            player_hp -= taken
            detail.append(f"Дайсны {'шид' if intent == 'hex' else 'дайралт'} {taken} амь хаслаа.")
        elif intent == "rest":
            detail.append("Дайсан амарч байна.")
        elif intent == "shield" and action != "strike":
            detail.append("Дайсан хуягаа хаалаа.")

        turn = len(history) + 1
        played_phase = phase
        continues = player_hp > 0 and enemy_hp > 0 and turn < limit
        if continues and phase == 1 and second_phase and enemy_hp <= second_phase["atHP"]:
            phase = 2
            phase_start = turn
            pattern = second_phase["patterns"]
        history.append({
            "turn": turn, "action": action, "intent": intent,
            "phase": played_phase, "nextPhase": phase if continues else None,
            "nextIntent": intent_at(turn) if continues else None,
            "playerHP": player_hp, "enemyHP": enemy_hp, "potions": potions,
            "focus": charged, "damageTaken": previous_player + healing - player_hp,
            "damageDealt": previous_enemy - enemy_hp, "healed": healing,
            "text": " ".join(detail),
        })

    def no_input(*args):
        raise ValueError("Оролтын утгаа кодод хувьсагчаар бичээрэй.")

    commands = {
        "strike": lambda: act("strike"), "guard": lambda: act("guard"),
        "heal": lambda: act("heal"), "sense": sense, "alive": alive,
        "health": lambda: player_hp, "enemy_health": lambda: enemy_hp,
        "potions_left": lambda: potions,
    }
    scope = {"__name__": "__main__", "input": no_input}
    scope.update({key: commands[key] for key in encounter["commands"]})
    try:
        exec(compile(request["code"], "battle.py", "exec"), scope)
    except BaseException as exc:
        kind = "code"
        error = "".join(traceback.format_exception_only(type(exc), exc)).strip()
    else:
        if enemy_hp == 0 and player_hp > 0:
            kind, error = "victory", ""
        elif player_hp == 0:
            kind, error = "loss", "Баатрын амь дууслаа. Дайсны санааг ажиглаад тактикаа өөрчилж үзээрэй."
        elif len(history) == limit:
            kind, error = "loss", f"{limit} ээлж дууслаа. Цохилт хийх боломжоо хайгаарай."
        else:
            kind, error = "incomplete", f"Дайсанд {enemy_hp} амь үлдлээ. Коддоо дараагийн үйлдлээ нэмж бичээрэй."
    return json.dumps({"ok": kind == "victory", "kind": kind, "error": error,
                       "trace": history, "playerHP": player_hp, "enemyHP": enemy_hp,
                       "turns": len(history), "potions": potions}, ensure_ascii=False)


run_battle(__request_json)
