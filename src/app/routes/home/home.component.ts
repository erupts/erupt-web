import {Component, OnInit} from '@angular/core';
import {SettingsService} from "@delon/theme";
import {Router} from "@angular/router";
import {EruptAppData} from "@shared/model/erupt-app.model";

@Component({
    templateUrl: './home.component.html',
    styles: []
})
export class HomeComponent implements OnInit {

    url: string;

    spin: boolean = true;

    constructor(private settingsService: SettingsService,
                private router: Router) {

    }

    ngOnInit() {
        let path = this.settingsService.user["indexPath"];
        if (path) {
            this.router.navigateByUrl(path).then();
        } else {
            this.url = "home.html?v=" + EruptAppData.get().hash;
        }
        setTimeout(() => {
            this.spin = false;
        }, 3000)
    }

    iframeLoad() {
        this.spin = false;
    }

}
