import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {DataService} from "@shared/service/data.service";

@Component({
    selector: 'app-site',
    templateUrl: './site.component.html',
    styles: []
})
export class SiteComponent implements OnInit {

    url: string;

    targetUrl: string;

    spin: boolean = false;

    constructor(public route: ActivatedRoute, public dataService: DataService) {
    }

    ngOnInit() {
        this.route.queryParamMap.subscribe(map => {
            if (map.get("target") === "blank") {
                this.targetUrl = map.get("url");
                window.open(this.targetUrl);
            } else {
                this.spin = true;
                this.url = map.get("url");
            }
        });
    }

    iframeLoad() {
        this.spin = false;
    }

}
