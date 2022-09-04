import {Component, Input, OnInit} from '@angular/core';
import {StatusService} from "@shared/service/status.service";

@Component({
    selector: 'erupt-page-header',
    template: `
        <page-header [syncTitle]="" [autoTitle]="false" homeI18n="global.home" [title]="null" *ngIf="!isFillLayout">
            <div class="desc" *ngIf="desc"[innerHTML]="desc|safeHtml"></div>
        </page-header>
    `,
    styleUrls: ["./erupt-page-header.component.less"],
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
