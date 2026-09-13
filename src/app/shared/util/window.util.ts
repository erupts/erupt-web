// Size an iframe to its content. Only works same-origin: a cross-origin frame
// throws on contentWindow access, and must report its height itself instead.
export function IframeHeight(event: any) {
    let iframe: any = event.target || (event.path || (event.composedPath && event.composedPath()))[0];
    if (!iframe) {
        return;
    }
    try {
        let iframeWin = iframe.contentWindow || iframe.contentDocument.parentWindow;
        if (iframeWin.document.body) {
            iframe.height = (iframeWin.document.documentElement.scrollHeight || iframeWin.document.body.scrollHeight);
        }
    } catch (e) {
        // cross-origin frame, leave the height alone
    }
}
