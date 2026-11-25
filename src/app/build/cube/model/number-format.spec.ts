import {formatNumber, NumberUnit} from "./number-format";

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
