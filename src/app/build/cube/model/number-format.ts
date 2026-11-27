/** A unit a figure is counted in: its divisor and the mark shown after the number */
export enum NumberUnit {
    K = 'K',  // thousand
    W = 'W',  // ten thousand
    M = 'M',  // million
    Y = 'Y',  // hundred million
    B = 'B',  // billion
}

export const NUMBER_UNITS: Record<NumberUnit, { divisor: number; mark: string }> = {
    [NumberUnit.K]: {divisor: 1e3, mark: 'K'},
    [NumberUnit.W]: {divisor: 1e4, mark: '万'},
    [NumberUnit.M]: {divisor: 1e6, mark: 'M'},
    [NumberUnit.Y]: {divisor: 1e8, mark: '亿'},
    [NumberUnit.B]: {divisor: 1e9, mark: 'B'},
};

/** How a figure is written, kept under `report.ui.format` */
export interface NumberFormat {
    thousands?: boolean;        // 1,234,567
    unit?: NumberUnit | null;
    decimals?: number | null;   // fixed number of decimals; unset = as the value has them (two at most after a unit)
    prefix?: string;
    suffix?: string;
}

/** Writes a value by a format. Without one, and for anything that is not a number, the value is shown as it is */
export function formatNumber(value: any, format?: NumberFormat | null): string {
    if (value === null || value === undefined) return '';
    const number = typeof value === 'number' ? value : Number(value);
    if (!format || value === '' || !isFinite(number)) return String(value);
    const unit = format.unit ? NUMBER_UNITS[format.unit] : null;
    const scaled = unit ? number / unit.divisor : number;
    const decimals = format.decimals;
    let text = decimals !== null && decimals !== undefined ? scaled.toFixed(Math.max(0, Math.min(10, decimals)))
        : unit ? String(Math.round(scaled * 100) / 100)
            : String(scaled);
    if (format.thousands) {
        const [whole, fraction] = text.split('.');
        text = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction ? '.' + fraction : '');
    }
    return (format.prefix || '') + text + (unit ? unit.mark : '') + (format.suffix || '');
}

/**
 * One frame of a figure rolling from one value to another: eased out, so it slows into the target, and kept to
 * the decimals the target has, so the digits do not flicker through a long fraction on the way
 */
export function rollFrame(from: number, to: number, progress: number): number {
    if (progress >= 1) return to;
    const eased = 1 - Math.pow(1 - Math.max(0, progress), 3);
    const decimals = Math.min(10, (String(to).split('.')[1] || '').length);
    const factor = Math.pow(10, decimals);
    return Math.round((from + (to - from) * eased) * factor) / factor;
}
