const BATTLE_INTENTS = {
    rest: 'Амарч байна',
    hit: 'Довтлоно',
    charge: 'Хүчтэй дайрна',
    shield: 'Хуягтай',
    hex: 'Ид шид хэрэглэнэ'
};

const BATTLE_COMMANDS = {
    strike: '3 онооны цохилт хийнэ. Амжилттай хаалтын дараах цохилт 5 оноо авна.',
    guard: 'Энгийн болон хүчтэй дайралтыг бүрэн хаана. Амжилттай хаавал дараагийн цохилтод 2 хүч нэмэгдэнэ.',
    heal: 'Нэг ундаа ууж 6 хүртэл амь нөхнө. Тэр ээлжид дайсан мөн үйлдлээ хийнэ.',
    sense: 'Дайсны энэ ээлжийн санааг англи үгээр буцаана.',
    alive: 'Баатар болон дайсан тулалдах боломжтой бол True утга буцаана.',
    health: 'Баатрын одоогийн амийг буцаана.',
    enemy_health: 'Дайсны одоогийн амийг буцаана.',
    potions_left: 'Үлдсэн эмчилгээний ундааны тоог буцаана.'
};

const BATTLES = [
    {
        id: 0, kind: 'slime', title: 'Булаг дээрх учрал', enemy: 'Ногоон дусал',
        story: 'Булгийн усанд нэг дусал ойж буугаад зам хаачихлаа. Аялагч анх удаа илдээ сугалав.',
        lesson: 'Нэг strike() нэг ээлж зарцуулж, 3 амь хасна. Дусал 6 амьтай. Команд бүрийг шинэ мөрөнд бичээрэй.',
        starter: '# Эхний цохилт бэлэн. Дараагийн үйлдлээ бич.\nstrike()\n',
        hint: 'Дайсны 6 амийг хоёр цохилтоор дуусгана. Эхний мөрийн доор strike() гэж дахин бич.',
        solution: 'strike()\nstrike()',
        hp: 6, playerHP: 8, potions: 0, maxTurns: 5, reward: 100,
        patterns: ['rest', 'hit'], commands: ['strike']
    },
    {
        id: 1, kind: 'wolf', title: 'Сарны жим', enemy: 'Мөнгөн чоно',
        story: 'Чоно газарт бөхийн дайрахаар зэхэж байна. Дайралтыг нь тосоод, амрах хооронд нь хариу цохь.',
        lesson: 'Чонын дайралт 7 амь хасна. guard() түүнийг бүрэн хааж, дараагийн strike()-ийг 5 хүчтэй болгоно. Чоно дараалан хоёр ээлж амарна.',
        starter: '# Эхний дайралтыг хаагаарай.\n# Дараагийн хоёр ээлжид цохино.\n',
        hint: 'Эхний мөрөнд guard() дууд. Дараа нь strike() командыг хоёр удаа дууд. 5 + 3 = 8.',
        solution: 'guard()\nstrike()\nstrike()',
        hp: 8, playerHP: 7, chargeDamage: 7, potions: 0, maxTurns: 6, reward: 140,
        patterns: ['charge', 'rest', 'rest'], commands: ['guard', 'strike']
    },
    {
        id: 2, kind: 'golem', title: 'Чулуун харуул', enemy: 'Болор голем',
        story: 'Агуйн үүдэнд болор нүд асав. Харуул хуягаа хааж, дайраад, дараа нь хэсэг амардаг.',
        lesson: 'Големын гурван ээлж ижил дарааллаар давтагдана. Хуягтай үед цохилт ойж, баатар 1 амь алддаг. Хоёр удаагийн дайралтыг хааж, амрах ээлж бүрд хариу цохь.',
        starter: 'for i in range(2):\n    # Хуяг, дайралт, амралт гэсэн 3 ээлж.\n    pass\n',
        hint: 'Давталт бүрд guard(), guard(), strike() гэсэн гурван мөрийг 4 зайгаар доголлуул. Хүч нэмэгдсэн хоёр цохилт 10 амь хасна.',
        solution: 'for i in range(2):\n    guard()\n    guard()\n    strike()',
        hp: 10, playerHP: 8, chargeDamage: 8, potions: 0, maxTurns: 9, reward: 170,
        patterns: ['shield', 'charge', 'rest'], commands: ['guard', 'strike', 'sense']
    },
    {
        id: 3, kind: 'wraith', title: 'Манангийн дэнлүү', enemy: 'Манангийн сүнс',
        story: 'Хуучин дэнлүүний гэрэл тасалдахад манангаас сүнс тодров. Цүнхэнд хоёр ундаа бий.',
        lesson: 'Сүнсний шид хамгаалалт нэвтэлж 4 амь хасна. sense() нь амрах үед "rest" гэж буцаана. Амь 2 буюу түүнээс бага үед нь амрах ээлжийг тааруулж ундаагаа уу.',
        starter: 'while alive():\n    if sense() == "rest" and health() <= 2 and potions_left() > 0:\n        # break-ийг эмчилгээний командаар солиорой.\n        break\n    else:\n        strike()\n',
        hint: 'if-ийн дотор heal(), else-ийн дотор strike() дууд. Аль аль нь өөрийн ээлжийг дуусгана.',
        solution: 'while alive():\n    if sense() == "rest" and health() <= 2 and potions_left() > 0:\n        heal()\n    else:\n        strike()',
        hp: 15, playerHP: 6, hexDamage: 4, potions: 2, maxTurns: 9, reward: 200,
        patterns: ['hex', 'rest', 'rest'], commands: ['strike', 'heal', 'sense', 'alive', 'health', 'potions_left']
    },
    {
        id: 4, kind: 'dragon', title: 'Цайзын сүүлчийн харуул', enemy: 'Галт луу',
        story: 'Галт цайзын үүдэнд луу далавчаа дэлгэлээ. Лууны нүүдлийг ээлж бүрд ажиглаад, хариу үйлдлээ функцээр бичээрэй.',
        lesson: 'sense() дуудлага ээлж зарцуулахгүй. "charge" үед 10 хүчээр дайрна, "shield" үед хуяглана. "hex" нь хамгаалалт нэвтэлж 4 амь хасна. Өөрийн амь, ундааны тоонд тааруулж нэг үйлдэл сонго.',
        starter: 'def my_turn():\n    intent = sense()\n    # Аюултай үед хаа, амрах үед эдгээ, бусад үед цохь.\n    strike()\n\nwhile alive():\n    my_turn()\n',
        hint: 'intent in ("charge", "shield") бол guard(). Амрах үед health() <= 6, potions_left() > 0 бол heal(). Үлдсэн ээлжид strike().',
        solution: 'def my_turn():\n    intent = sense()\n    if intent in ("charge", "shield"):\n        guard()\n    elif intent == "rest" and health() <= 6 and potions_left() > 0:\n        heal()\n    else:\n        strike()\n\nwhile alive():\n    my_turn()',
        hp: 23, playerHP: 10, chargeDamage: 10, hitDamage: 3, hexDamage: 4, potions: 2, maxTurns: 16, reward: 250,
        patterns: ['charge', 'rest', 'shield', 'hex', 'rest', 'hit'],
        commands: ['strike', 'guard', 'heal', 'sense', 'alive', 'health', 'enemy_health', 'potions_left']
    }
];
