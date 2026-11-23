const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, 'dist/client/greenhouse-share.js'), 'utf8');
function openGame() {
    const page = {window: {}};
    vm.runInNewContext(source, page);
    return page.window.GreenhouseShare;
}
const sender = openGame();
const recipient = openGame();
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

test('two isolated offline games exchange ordered readings using stable G1 codes', () => {
    const fixtures = [
        [[18, 30, 65, 31, 90], 'G1-1RRD-P06B'],
        [[100, 100, 100, 100, 100], 'G1-9S76-T0MK'],
        [[0, 0, 0, 0, 0], 'G1-0000-0000']
    ];
    for (const [values, code] of fixtures) {
        assert.equal(sender.encode(values), code);
        assert.deepEqual(Array.from(recipient.decode(code)), values);
    }
    assert.deepEqual(Array.from(recipient.decode(' g1 irrd po6b ')), fixtures[0][0]);
    for (let index = 0; index < 5; index++) {
        for (let moisture = 0; moisture <= 100; moisture++) {
            const values = [29, 30, 31, 100, 0];
            values[index] = moisture;
            assert.deepEqual(Array.from(recipient.decode(sender.encode(values))), values);
        }
    }
});

test('the checksum rejects mistyped symbols and swapped adjacent symbols including the check digit', () => {
    const body = '1RRDP06B';
    for (let index = 0; index < body.length; index++) {
        for (const digit of alphabet) {
            if (digit === body[index]) continue;
            const mistyped = body.slice(0,index) + digit + body.slice(index+1);
            assert.throws(() => recipient.decode('G1' + mistyped));
        }
        if (index + 1 < body.length && body[index] !== body[index+1]) {
            const transposed = body.slice(0,index) + body[index+1] + body[index] + body.slice(index+2);
            assert.throws(() => recipient.decode('G1' + transposed));
        }
    }
});

test('invalid readings, missing digits, unknown versions and out-of-range payloads are rejected', () => {
    for (const values of [[-1,1,1,1,1], [1,1,1,1,101], [0,1,2,3,4.5], [0,1,2,3,'4'], new Array(5), [1,2,3], null]) {
        assert.throws(() => sender.encode(values));
    }
    for (const code of [null, '', 'G2-0000-0000', 'G1-0000-000', 'G1-0000-00000', 'G1-0000-000?', 'G1-0000-000U']) {
        assert.throws(() => recipient.decode(code));
    }
    for (const checkDigit of alphabet) assert.throws(() => recipient.decode('G1-ZZZZ-ZZZ' + checkDigit));
});
