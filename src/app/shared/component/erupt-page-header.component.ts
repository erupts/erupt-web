import {Component, Input, OnInit} from '@angular/core';
import {StatusService} from "@shared/service/status.service";

@Component({
    selector: 'erupt-page-header',
    template: `
        <page-header [syncTitle]="" [autoTitle]="false" homeI18n="global.home" [title]="null" *ngIf="!isFillLayout">
            <div *ngIf="desc" style="margin-top: 8px" [innerHTML]="desc|safeHtml"></div>
        </page-header>
    `,
    styles: []
})
export class EruptPageHeaderComponent implements OnInit {

    isFillLayout: boolean;

    @Input() desc: string;

    constructor(private statusService: StatusService) {

    }

    ngOnInit() {
        this.isFillLayout = this.statusService.isFillLayout;
    }

}
