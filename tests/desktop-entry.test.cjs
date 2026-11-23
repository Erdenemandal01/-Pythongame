const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const client = path.join(__dirname, '../dist/client');
const detect = vm.runInNewContext(fs.readFileSync(path.join(client, 'device-class.js'), 'utf8') + '\nisClassroomHandheld');
const mobile = [
    {userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile Safari/604.1'},
    {userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel Tablet) Chrome/130 Safari/537.36'},
    {userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari/605.1.15', platform: 'MacIntel', touchPoints: 5},
    {userAgent: 'Mozilla/5.0 (Linux; x86_64)', platform: 'Android'},
    {formFactors: ['Tablet']},
    {mobile: true}
];
const desktop = [
    {userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32', touchPoints: 10},
    {userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari/605.1.15', platform: 'MacIntel', touchPoints: 0},
    {userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 16009.0.0)', platform: 'Chrome OS', touchPoints: 10}
];
test('phone, tablet and desktop-mode iPad use the transfer screen; desktop touchscreens can play', () => {
    mobile.forEach(signal => assert.equal(detect(signal), true, JSON.stringify(signal)));
    desktop.forEach(signal => assert.equal(detect(signal), false, JSON.stringify(signal)));
});

test('the desktop bootstrap and offline worker shim sit on the appropriate side of the gate', () => {
    const html = fs.readFileSync(path.join(client, 'index.html'), 'utf8');
    const sections = html.match(/<template id="pq-game-scripts">([\s\S]*?)<\/template>/);
    assert(sections[1].includes('src="curriculum.js"'));
    assert(sections[1].includes('src="battle-ui.js?'));
    assert(sections[1].includes('src="app.js?'));
    const startup = html.replace(sections[0], '');
    assert.deepEqual([...startup.matchAll(/<script src="([^"]+)"/g)].map(a => a[1].split('?')[0]), ['device-class.js', 'desktop-only.js']);
});
