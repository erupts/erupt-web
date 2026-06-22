import {Component, Inject, OnInit} from '@angular/core';
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
export class HomeComponent implements OnInit {

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
        }, 3000)
    }

    iframeLoad() {
        this.spin = false;
    }

}
