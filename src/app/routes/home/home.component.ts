import {Component, OnInit} from '@angular/core';
import {NzModalService} from "ng-zorro-antd";
import {EruptAppData} from "@core/startup/erupt-app.data";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styles: []
})
export class HomeComponent implements OnInit {

    url: string;

    spin: boolean = true;

    constructor(private modal: NzModalService) {
    }

    ngOnInit() {
        this.url = "home.html?v=" + EruptAppData.get().hash;
    }

    iframeLoad() {
        this.spin = false;
    }

}
