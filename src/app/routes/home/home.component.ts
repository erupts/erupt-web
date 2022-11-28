import {Component, OnInit} from '@angular/core';
import {EruptAppData} from "@core/startup/erupt-app.data";
import {SettingsService} from "@delon/theme";
import {Router} from "@angular/router";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styles: []
})
export class HomeComponent implements OnInit {

    url: string;

    spin: boolean = true;

    constructor(private settingsService: SettingsService, private router: Router) {
    }

    ngOnInit() {
        let path = this.settingsService.user.indexPath;
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
