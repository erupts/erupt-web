import {formatNumber, NumberUnit, rollFrame} from "./number-format";

describe('formatNumber', () => {

    it('leaves a value alone without a format, or when it is not a number', () => {
        expect(formatNumber(4203000)).toBe('4203000');
        expect(formatNumber('n/a', {thousands: true})).toBe('n/a');
        expect(formatNumber(null, {thousands: true})).toBe('');
        expect(formatNumber('', {thousands: true})).toBe('');
    });

    it('groups thousands, of negatives and decimals too', () => {
        expect(formatNumber(4203000, {thousands: true})).toBe('4,203,000');
        expect(formatNumber(-1234567.5, {thousands: true})).toBe('-1,234,567.5');
        expect(formatNumber(999, {thousands: true})).toBe('999');
        expect(formatNumber('93400', {thousands: true})).toBe('93,400');
    });

    it('counts in a unit, two decimals at most unless told', () => {
        expect(formatNumber(4203000, {unit: NumberUnit.W})).toBe('420.3万');
        expect(formatNumber(4203000, {unit: NumberUnit.M})).toBe('4.2M');
        expect(formatNumber(4203000, {unit: NumberUnit.M, decimals: 3})).toBe('4.203M');
        expect(formatNumber(1234567890, {unit: NumberUnit.K, thousands: true, decimals: 0})).toBe('1,234,568K');
    });

    it('fixes the decimals and wraps the figure', () => {
        expect(formatNumber(93400, {decimals: 2})).toBe('93400.00');
        expect(formatNumber(38, {suffix: '%'})).toBe('38%');
        expect(formatNumber(4203000, {prefix: '$', thousands: true, suffix: ' USD'})).toBe('$4,203,000 USD');
    });

});

describe('rollFrame', () => {

    it('starts at the old value and lands exactly on the new one', () => {
        expect(rollFrame(100, 200, 0)).toBe(100);
        expect(rollFrame(100, 200, 1)).toBe(200);
        expect(rollFrame(100, 200, 1.5)).toBe(200);
    });

    it('eases out: more than half way by the middle', () => {
        expect(rollFrame(0, 1000, 0.5)).toBeGreaterThan(500);
        expect(rollFrame(0, 1000, 0.5)).toBeLessThan(1000);
    });

    it('keeps to the decimals of the target', () => {
        expect(Number.isInteger(rollFrame(0, 4203, 0.37))).toBe(true);
        expect(String(rollFrame(0, 12.5, 0.37)).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(1);
    });

    it('rolls down as well as up', () => {
        const frame = rollFrame(500, 100, 0.5);
        expect(frame).toBeLessThan(500);
        expect(frame).toBeGreaterThan(100);
    });

});
