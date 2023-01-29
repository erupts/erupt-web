import {Component, Input, OnInit} from '@angular/core';
import {StatusService} from "@shared/service/status.service";
import {SettingsService} from "@delon/theme";

@Component({
    selector: 'erupt-page-header',
    template: `
        <ng-container *ngIf="settingSrv.layout['breadcrumbs']">
            <div style="height: 16px"></div>
<!--            <page-header [syncTitle]="" [autoTitle]="false" homeI18n="global.home" [title]="null" *ngIf="!isFillLayout">-->
<!--                <div class="desc" *ngIf="desc" [innerHTML]="desc|safeHtml"></div>-->
<!--            </page-header>-->
        </ng-container>
        <ng-container *ngIf="!settingSrv.layout['breadcrumbs']">
            <div style="height: 16px"></div>
        </ng-container>
    `,
    styleUrls: ["./erupt-page-header.component.less"],
    styles: []
})
export class EruptPageHeaderComponent implements OnInit {

    isFillLayout: boolean = false;

    @Input() desc: string;

    constructor(private statusService: StatusService, public settingSrv: SettingsService,) {

    }

    ngOnInit() {
        this.isFillLayout = this.statusService.isFillLayout;
    }

}
