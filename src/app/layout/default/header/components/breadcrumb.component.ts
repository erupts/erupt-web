import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'erupt-breadcrumb',
    template: `
        <nz-breadcrumb [nzAutoGenerate]="true">
            <nz-breadcrumb-item>
                <i nz-icon nzType="home"></i>
            </nz-breadcrumb-item>
            <nz-breadcrumb-item>
                <a>
                    <i nz-icon nzType="user"></i>
                    <span>Application List</span>
                </a>
            </nz-breadcrumb-item>
            <nz-breadcrumb-item>Application</nz-breadcrumb-item>
        </nz-breadcrumb>
    `
})
export class BreadcrumbComponent implements OnInit {

    constructor() {
    }

    ngOnInit(): void {
    }

}
