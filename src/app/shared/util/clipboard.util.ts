// Puts text on the clipboard. navigator.clipboard exists only in a secure context (https or
// localhost); on plain http the deprecated execCommand('copy') still works in every browser, so it
// is the fallback there. Resolves whether the text got on the clipboard: false when neither way is
// open (the caller then tells the user to copy by hand).
export function copyText(text: string): Promise<boolean> {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
}

function legacyCopy(text: string): boolean {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        document.body.removeChild(area);
    }
}
