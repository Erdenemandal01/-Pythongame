// A challenge carries just the five starting moisture readings, in pot order.
window.GreenhouseShare = (() => {
    'use strict';
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const potCount = 5;
    const moistureBase = 101;
    const payloadLength = 7;
    const invalidCode = 'Сорилын кодыг шалгаарай. G1-ээр эхэлсэн кодыг бүтнээр нь оруулна уу.';

    function checksum(digits) {
        // GF(32), x^5 + x^2 + 1. Detects one changed digit or adjacent transposition.
        let state = 0;
        for (const digit of digits) {
            state ^= digit;
            state = (state << 1) ^ ((state & 16) ? 0x25 : 0);
        }
        return state;
    }

    function encode(values) {
        if (!Array.isArray(values) || values.length !== potCount) {
            throw new Error('Таван савны чийгийг оруулна уу.');
        }
        let packed = 0;
        for (const moisture of values) {
            if (!Number.isInteger(moisture) || moisture < 0 || moisture >= moistureBase) {
                throw new Error('Сав бүрийн чийг 0–100 хүртэлх бүхэл тоо байна.');
            }
            packed = packed * moistureBase + moisture;
        }
        // The payload fits in an exact JS number, but exceeds the 32-bit bitwise range.
        const digits = new Array(payloadLength);
        for (let index = payloadLength - 1; index >= 0; index--) {
            digits[index] = packed % 32;
            packed = Math.floor(packed / 32);
        }
        digits.push(checksum(digits));
        const text = digits.map(digit => alphabet[digit]).join('');
        return 'G1-' + text.slice(0, 4) + '-' + text.slice(4);
    }

    function decode(input) {
        if (typeof input !== 'string' || input.length > 64) throw new Error(invalidCode);
        const text = input.toUpperCase().replace(/[\s-]/g, '');
        if (text.length !== 10 || !text.startsWith('G1')) throw new Error(invalidCode);
        const body = text.slice(2).replace(/O/g, '0').replace(/[IL]/g, '1');
        const digits = Array.from(body, char => alphabet.indexOf(char));
        if (digits.includes(-1)) throw new Error(invalidCode);
        const checkDigit = digits.pop();
        if (checksum(digits) !== checkDigit) {
            throw new Error('Кодын нэг тэмдэг зөрж байна. Найзынхаа кодтой тулгаад дахин оруулаарай.');
        }
        let packed = 0;
        for (const digit of digits) packed = packed * 32 + digit;
        if (packed >= moistureBase ** potCount) throw new Error(invalidCode);
        const readings = new Array(potCount);
        for (let index = potCount - 1; index >= 0; index--) {
            readings[index] = packed % moistureBase;
            packed = Math.floor(packed / moistureBase);
        }
        return readings;
    }

    return Object.freeze({encode, decode});
})();
