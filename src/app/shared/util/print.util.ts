import {BuiltinPrintConfig, PaperOrientation, PaperSize, PrintLabelLayout} from "@shared/model/erupt-print";

/**
 * Print an element in a hidden iframe that carries the page's own stylesheets, so the layout
 * reflows to the paper width instead of keeping the on-screen pixel sizes (what print-js's
 * targetStyles does by inlining every computed style).
 * The element is printed with its outerHTML, so for an emulated-encapsulation component pass
 * the host element: its `_nghost` attribute is what the component's `:host` rules match.
 */
export function printElement(el: HTMLElement, css: string = ''): void {
    printHtml(el.outerHTML, css, true);
}

/**
 * Print an html fragment in a hidden iframe. pageStyles brings the page's stylesheets along; a
 * self-contained fragment such as a server-rendered template goes without them, so the app's
 * global styles never restyle it.
 */
export function printHtml(html: string, css: string = '', pageStyles: boolean = false): void {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(iframe);
    const styles = !pageStyles ? '' : Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        // the dark / compact theme bundle: paper is always the light, regular-density theme
        .filter(n => n.id !== 'site-theme-style')
        .map(n => n.outerHTML)
        .join('');
    const win = iframe.contentWindow;
    const doc = win.document;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${document.baseURI}">${styles}`
        + `<style>body{margin:0;background:#fff}${css}</style></head><body>${html}</body></html>`);
    doc.close();
    const loaded = (node: HTMLLinkElement | HTMLImageElement) => new Promise<void>(resolve => {
        node.addEventListener('load', () => resolve(), {once: true});
        node.addEventListener('error', () => resolve(), {once: true});
    });
    const pending = [
        ...Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).filter(l => !l.sheet).map(loaded),
        ...Array.from(doc.images).filter(img => !img.complete).map(loaded)
    ];
    Promise.all(pending).then(() => doc.fonts.ready).then(() => {
        win.addEventListener('afterprint', () => iframe.remove(), {once: true});
        win.focus();
        win.print();
    });
}

const BUILTIN_CONFIG_KEY = "print-builtin-config";

// The built-in print settings: the viewer's last choice over the defaults, shared by every model
export function loadBuiltinPrintConfig(defaultCol: number = 3): BuiltinPrintConfig {
    let saved: Partial<BuiltinPrintConfig> = {};
    try {
        saved = JSON.parse(localStorage.getItem(BUILTIN_CONFIG_KEY)) || {};
    } catch {
        // unreadable storage: defaults
    }
    return {
        layout: PrintLabelLayout.VERTICAL,
        col: defaultCol,
        bordered: true,
        borderColor: '#d9d9d9',
        fontSize: 13,
        showTitle: true,
        paperSize: PaperSize.A4,
        orientation: PaperOrientation.PORTRAIT,
        margin: 10,
        ...saved
    };
}

export function saveBuiltinPrintConfig(config: BuiltinPrintConfig): void {
    try {
        localStorage.setItem(BUILTIN_CONFIG_KEY, JSON.stringify(config));
    } catch {
        // storage unavailable: the settings simply last for this preview
    }
}

// Paper, font and color rules every printout shares; margin is a CSS margin value
export function printPageCss(paperSize: string, orientation: string, margin: string): string {
    const size = !paperSize || paperSize === PaperSize.AUTO ? 'auto' : `${paperSize} ${orientation}`;
    return `
        .print-config-bar { display: none !important; }
        * {
            font-family: 'Heiti SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        @page { size: ${size}; margin: ${margin}; }
    `;
}
