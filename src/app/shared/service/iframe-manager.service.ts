import {Injectable} from '@angular/core';
import {SettingsService} from '@delon/theme';

@Injectable({ providedIn: 'root' })
export class IframeManagerService {
    private container: HTMLElement | null = null;
    private iframes = new Map<string, HTMLIFrameElement>();
    private pendingUrl: string | null = null;
    private prevReuse: boolean = false;

    constructor(private settings: SettingsService) {}

    private get reuse(): boolean {
        return !!this.settings.layout['reuse'];
    }

    private syncContainerTop(): void {
        if (this.container) {
            this.container.style.top = this.reuse ? '41px' : '0';
        }
    }

    setContainer(el: HTMLElement): void {
        this.container = el;
        this.prevReuse = this.reuse;
        this.syncContainerTop();

        this.settings.notify.subscribe(() => {
            const current = this.reuse;
            this.syncContainerTop();
            if (this.prevReuse && !current) {
                this.clearIframes();
            }
            this.prevReuse = current;
        });

        if (this.pendingUrl) {
            this.show(this.pendingUrl);
            this.pendingUrl = null;
        }
    }

    isInitialized(): boolean {
        return this.container !== null;
    }

    show(url: string): void {
        if (!this.container) {
            this.pendingUrl = url;
            return;
        }
        this.syncContainerTop();
        if (!this.iframes.has(url)) {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.setAttribute('frameborder', '0');
            iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;z-index:0;';
            this.container.appendChild(iframe);
            this.iframes.set(url, iframe);
        }
        this.iframes.forEach((el, key) => {
            el.style.zIndex = key === url ? '1' : '0';
        });
        this.container.style.visibility = 'visible';
        this.container.style.pointerEvents = 'auto';
    }

    hideAll(): void {
        if (this.container) {
            this.container.style.visibility = 'hidden';
            this.container.style.pointerEvents = 'none';
        }
    }

    remove(url: string): void {
        const el = this.iframes.get(url);
        if (el) {
            el.remove();
            this.iframes.delete(url);
        }
        if (this.iframes.size === 0) {
            this.hideAll();
        }
    }

    private clearIframes(): void {
        this.iframes.forEach(el => el.remove());
        this.iframes.clear();
        this.hideAll();
    }
}
