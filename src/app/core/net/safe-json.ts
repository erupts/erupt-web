/**
 * JSON.parse that keeps integers beyond Number.MAX_SAFE_INTEGER as strings,
 * so 64-bit backend ids (e.g. snowflake) survive the JS number precision limit.
 *
 * Relies on the reviver "source text access" (3rd reviver argument, Chrome 114+ /
 * Firefox 129+ / Safari 17.4+). On engines without it, falls back to plain
 * JSON.parse behavior.
 */
export function safeJsonParse(text: string): any {
    if (!text) {
        return null;
    }
    return JSON.parse(text, function (key: string, value: any) {
        if (typeof value === "number" && !Number.isSafeInteger(value)) {
            let source = arguments[2] && (arguments[2] as any).source;
            // only pure integer literals; floats keep their number type
            if (source && /^-?\d+$/.test(source)) {
                return source;
            }
        }
        return value;
    } as any);
}
