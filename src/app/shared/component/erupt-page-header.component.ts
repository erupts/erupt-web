import {Component, OnInit} from '@angular/core';
import {StatusServiceService} from "@shared/service/status-service.service";

@Component({
    selector: 'erupt-page-header',
    template:  `
        <page-header [autoTitle]="false" [title]="null" *ngIf="!isFillLayout">
        </page-header>
    `,
    styles: []
})
export class EruptPageHeaderComponent implements OnInit {

    isFillLayout: boolean;

    constructor(private statusService: StatusServiceService) {

    }

    ngOnInit() {
        this.isFillLayout = this.statusService.isFillLayout;
    }

}
