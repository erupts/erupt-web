import {Component, OnInit} from '@angular/core';
import {SettingsService, TitleService} from "@delon/theme";
import {Router} from "@angular/router";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {I18NService} from "@core";

@Component({
    templateUrl: './home.component.html',
    styles: []
})
export class HomeComponent implements OnInit {

    url: string;

    spin: boolean = true;

    constructor(private settingsService: SettingsService,
                private i18n: I18NService,
                private router: Router, private titleService: TitleService) {

    }

    ngOnInit() {
        let path = this.settingsService.user["indexPath"];
        if (path) {
            this.router.navigateByUrl(path).then();
        } else {
            this.url = "home.html?v=" + EruptAppData.get().hash;
        }
    }

    iframeLoad() {
        this.spin = false;
    }

}
