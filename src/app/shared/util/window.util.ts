export function IframeHeight(event: any) {
    let iframe = (event.path || (event.composedPath && event.composedPath()))[0];
    let iframeWin = iframe.contentWindow || iframe.contentDocument.parentWindow;
    if (iframeWin.document.body) {
        iframe.height = (iframeWin.document.documentElement.scrollHeight || iframeWin.document.body.scrollHeight);
    }
}
