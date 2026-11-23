// Existing saves have only lessons. An omitted battle campaign starts at the forest.
function readCampaign(saved) {
    const won = [];
    const drafts = {};
    for (const encounter of BATTLES) {
        if (won.length === encounter.id && Array.isArray(saved?.won) && saved.won.includes(encounter.id)) {
            won.push(encounter.id);
        }
        const code = saved?.drafts?.[encounter.id];
        if (typeof code === 'string') drafts[encounter.id] = code.slice(0, 20000);
    }
    const lastUnlocked = Math.min(won.length, BATTLES.length - 1);
    const selected = Number.isInteger(saved?.selected)
        ? Math.max(0, Math.min(saved.selected, lastUnlocked))
        : lastUnlocked;
    return {won, drafts, selected};
}

const relics = [
    ['Шүүдрийн дусал', 'Ойн замд олдсон ногоон болор.'],
    ['Мөнгөн соёо', 'Сарны туяанд гялалзах сахиус.'],
    ['Чулуун зүрх', 'Агуйн харуулын цээжинд асаж байсан чулуу.'],
    ['Сүнсний дэнлүү', 'Харанхуйд зам заах цэнхэр дөл.'],
    ['Лууны хайрс', 'Таван тулааныг туулсны дурсгал.']
];

function battleReward(id) {
    const campaign = state.battles;
    if (id !== campaign.won.length || !BATTLES[id]) return false;
    campaign.won.push(id);
    if (!state.days.includes(today())) state.days.push(today());
    persist();
    updateHeader();
    sound(true);
    toast('Олдвор авлаа! ' + relics[id][0]);
    return true;
}

function enterBattle(id) {
    if (busy) return toast('Эхлээд ажиллаж буй кодоо зогсооно уу.');
    state.battles.selected = Math.min(id, state.battles.won.length, BATTLES.length - 1);
    switchView('battle');
    window.scrollTo({top:0, behavior:'instant'});
}

function campaignTarget() {
    return BATTLES[Math.min(state.battles.won.length, BATTLES.length - 1)];
}

function renderCampaignMap() {
    const next = campaignTarget();
    const completed = state.battles.won.length === BATTLES.length;
    const banner = $('battleGate');
    banner.style.setProperty('--arena', 'url("art/battles/arena-' + next.kind + '.webp")');
    banner.querySelector('img').src = 'art/battles/enemy-' + next.kind + '.png';
    banner.querySelector('h2').textContent = next.title;
    banner.querySelector('p').textContent = next.story;
    $('battleGateLabel').textContent = 'ТУЛААН  ·  ' + state.battles.won.length + ' / ' + BATTLES.length + ' ЯЛАЛТ';
    $('challengeBtn').textContent = completed ? 'Дахин тулалдах' : 'Тулаанд орох';
    $('challengeBtn').onclick = () => enterBattle(next.id);
}

function showAmbush() {
    const next = campaignTarget();
    const call = $('ambush');
    const img = call.querySelector('img');
    img.src = 'art/battles/enemy-' + next.kind + '.png';
    call.querySelector('span').textContent = next.enemy + ' · Тулалдах';
    call.hidden = false;
    call.onclick = () => enterBattle(next.id);
}

function relicAwards() {
    return BATTLES.map(battle => ({
        icon: ['💧','🌙','🪨','🔥','🐉'][battle.id],
        title: relics[battle.id][0],
        desc: battle.enemy + ' · ' + relics[battle.id][1],
        earned: state.battles.won.includes(battle.id)
    }));
}
