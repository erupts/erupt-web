import {Component, Input, Optional} from '@angular/core';
import {NzDrawerRef} from "ng-zorro-antd/drawer";

/**
 * Header of a drawer that draws its own chrome (opened with nzTitle: null, nzClosable: false):
 * an icon and a title on the left, projected actions and a close button on the right. Used by the
 * notice center and the header AI chat so the two top-bar drawers look alike.
 *
 * It emits the same DOM as nz-drawer's own header, so the one global rule in styles/custom.less
 * (`.ant-drawer .ant-drawer-header`) sizes and colors both — no second copy of the chrome here.
 */
@Component({
    standalone: false,
    selector: 'erupt-drawer-header',
    template: `
        <div class="ant-drawer-header">
            <div class="ant-drawer-header-title">
                <div class="ant-drawer-title">
                    @if (icon) {
                        <span nz-icon [nzType]="icon" nzTheme="outline"></span>
                    }
                    <span>{{ title }}</span>
                </div>
            </div>
            <div class="ant-drawer-extra">
                <ng-content></ng-content>
            </div>
            @if (drawerRef) {
                <button class="ant-drawer-close" type="button" aria-label="Close" (click)="drawerRef.close()">
                    <span nz-icon nzType="close"></span>
                </button>
            }
        </div>
    `,
    styles: [`
        :host {
            display: block;
            flex-shrink: 0;
        }
    `]
})
export class DrawerHeaderComponent {

    @Input() icon: string;

    @Input() title: string;

    constructor(@Optional() public drawerRef: NzDrawerRef) {
    }

}
