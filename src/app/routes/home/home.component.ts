import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styles: []
})
export class HomeComponent implements OnInit {

    url: string;

    spin: boolean = true;

    constructor() {
    }

    ngOnInit() {
        this.url = "erupt/home.html";
    }

    iframeLoad() {
        this.spin = false;
    }

}
