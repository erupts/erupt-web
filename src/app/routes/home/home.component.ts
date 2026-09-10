import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SettingsService} from "@delon/theme";
import {Router} from "@angular/router";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {I18NService} from "@core";

@Component({
    standalone: false,
    templateUrl: './home.component.html',
    styles: [
        `
            :host {
                height: 100%;
                overflow: auto;
            }
        `
    ]
})
export class HomeComponent implements OnInit, OnDestroy {

    url: string;

    spin: boolean = true;

    constructor(private settingsService: SettingsService,
                private router: Router,
                @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
                private i18n: I18NService) {

    }

    ngOnInit() {
        let path = this.settingsService.user["indexPath"];
        if (path) {
            this.router.navigateByUrl(path).then();
        } else {
            let url = "home.html?v=" + EruptAppData.get().hash;
            url += "&_token=" + this.tokenService.get().token + "&_lang=" + this.i18n.currentLang;
            this.url = url;
        }
        setTimeout(() => {
            this.spin = false;
        }, 3000);
        // the settings drawer can flip the theme while this page is open
        this.schemeObserver = new MutationObserver(() => this.syncColorScheme());
        this.schemeObserver.observe(document.documentElement, {attributes: true, attributeFilter: ["class"]});
    }

    @ViewChild("frame") frame: ElementRef<HTMLIFrameElement>;

    private schemeObserver: MutationObserver;

    iframeLoad() {
        this.spin = false;
        this.syncColorScheme();
    }

    // The welcome frame draws no background of its own so the shell's surface
    // shows through. A browser only renders an iframe's canvas transparent
    // while the frame's used color-scheme MATCHES the embedder's; mismatched,
    // it paints an opaque Canvas color instead — which is why a dark shell got
    // a white sheet. The frame stays theme-free; the host just hands it the
    // one property that decides this.
    private syncColorScheme(): void {
        const doc = this.frame?.nativeElement?.contentDocument;
        if (!doc) {
            return;
        }
        doc.documentElement.style.colorScheme =
            document.documentElement.classList.contains("dark") ? "dark" : "light";
    }

    ngOnDestroy(): void {
        this.schemeObserver?.disconnect();
    }

}
