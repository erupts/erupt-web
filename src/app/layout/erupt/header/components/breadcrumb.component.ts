import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'erupt-breadcrumb',
    template: `
        <nz-breadcrumb [nzSeparator]="sep">
            <nz-breadcrumb-item>
                <a href="#">
                    <i nz-icon nzType="home"></i>
                </a>
            </nz-breadcrumb-item>
            &nbsp;&nbsp;/&nbsp;&nbsp;
            <nz-breadcrumb-item>
                AA
            </nz-breadcrumb-item>
            &nbsp;&nbsp;/&nbsp;&nbsp;
            <nz-breadcrumb-item>
                BB
            </nz-breadcrumb-item>
            &nbsp;&nbsp;/&nbsp;&nbsp;
            <nz-breadcrumb-item>
                CC
            </nz-breadcrumb-item>
            &nbsp;&nbsp;/&nbsp;&nbsp;
            <nz-breadcrumb-item>
                DD
            </nz-breadcrumb-item>
        </nz-breadcrumb>
        <ng-template #sep>
            /
        </ng-template>
    `
})
export class BreadcrumbComponent implements OnInit {

    constructor() {
    }

    ngOnInit(): void {
    }

}
