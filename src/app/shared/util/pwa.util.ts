// Installed app (PWA) helpers for the window-controls-overlay mode, where the
// OS window controls float over the top strip of the page.

// A draggable modal (nz-modal `nzDraggable`) can be dragged under the window
// controls: CDK's drag boundary is the overlay container, i.e. the whole
// window, and nz-modal exposes no hook to change it. The box is held back with
// a layout offset instead: while a drag is running, a margin-top absorbs
// whatever part of the CDK transform would take the box above the strip, so
// visual top = max(natural top, strip height). As the pointer comes back down
// the margin shrinks to zero and the box follows the pointer exactly again.
// Bubble-phase listeners run after CDK's capturing ones, so the rect measured
// here already includes the transform of the current move.
export function installModalDragClamp(): void {
    const clamp = () => {
        if (!window.matchMedia("(display-mode: window-controls-overlay)").matches) {
            return;
        }
        const modal = document.querySelector<HTMLElement>(".ant-modal.cdk-drag-dragging");
        if (!modal) {
            return;
        }
        const strip: number = (navigator as any).windowControlsOverlay?.getTitlebarAreaRect?.().height || 0;
        if (!strip) {
            return;
        }
        const current = parseFloat(modal.style.marginTop) || 0;
        const naturalTop = modal.getBoundingClientRect().top - current;
        const offset = Math.max(0, strip - naturalTop);
        modal.style.marginTop = offset ? `${offset}px` : "";
    };
    document.addEventListener("mousemove", clamp);
    document.addEventListener("touchmove", clamp, {passive: true});
}
