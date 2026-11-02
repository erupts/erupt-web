export const PIN_COLOR = '#1890ff';

// pin size in px; its tip sits at the bottom center
export const PIN_WIDTH = 24;
export const PIN_HEIGHT = 32;

/**
 * Loads a vendor SDK once. When the SDK calls back (`callback` query param) the promise
 * waits for that call instead of the script's onload.
 */
export function loadSdk(src: string, callback?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (callback) {
            window[callback] = () => {
                delete window[callback];
                resolve();
            };
            src += (src.includes('?') ? '&' : '?') + 'callback=' + callback;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => callback || resolve();
        script.onerror = () => reject(new Error('failed to load ' + src));
        document.head.appendChild(script);
    });
}

export function loadCss(href: string) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

/**
 * The marker pin, the same on every vendor: an svg the DOM vendors inline and Baidu takes as an icon url.
 */
export function pinSvg(color: string = PIN_COLOR): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 24 32" style="display:block;cursor:pointer;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">`
        + `<path d="M12 1C5.9 1 1 5.9 1 12c0 8 11 19 11 19s11-11 11-19c0-6.1-4.9-11-11-11z" fill="${color}" stroke="#fff" stroke-width="2"/>`
        + `<circle cx="12" cy="12" r="4" fill="#fff" opacity=".9"/></svg>`;
}

export function pinDataUrl(color?: string): string {
    return svgDataUrl(pinSvg(color));
}

// the bubble a vendor without its own cluster style draws for a group of `count` markers
export const BUBBLE_SIZE = 36;

export function bubbleSvg(count: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${BUBBLE_SIZE}" height="${BUBBLE_SIZE}" viewBox="0 0 36 36">`
        + `<circle cx="18" cy="18" r="16" fill="${PIN_COLOR}" fill-opacity=".85" stroke="#fff" stroke-width="2"/>`
        + `<text x="18" y="22" text-anchor="middle" font-size="12" font-family="sans-serif" fill="#fff">${count}</text></svg>`;
}

export function svgDataUrl(svg: string): string {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function pinElement(color?: string): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = pinSvg(color);
    return div;
}
