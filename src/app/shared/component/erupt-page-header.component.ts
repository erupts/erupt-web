import {Component, OnInit} from '@angular/core';
import {StatusService} from "@shared/service/status.service";

@Component({
    selector: 'erupt-page-header',
    template:  `
        <page-header [autoTitle]="false" homeI18n="global.home" [title]="null" *ngIf="!isFillLayout">
        </page-header>
    `,
    styles: []
})
export class EruptPageHeaderComponent implements OnInit {

    isFillLayout: boolean;

    constructor(private statusService: StatusService) {

    }

    ngOnInit() {
        this.isFillLayout = this.statusService.isFillLayout;
    }

}
