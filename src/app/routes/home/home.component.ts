import {Component, OnInit} from '@angular/core';
import {NzModalService} from "ng-zorro-antd";

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
        this.url = "home.html";
    }

    iframeLoad() {
        this.spin = false;
    }

}
