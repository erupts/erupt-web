import {Component, Input, Optional} from '@angular/core';
import {NzDrawerRef} from "ng-zorro-antd/drawer";

/**
 * Header of a drawer that draws its own chrome (opened with nzTitle: null, nzClosable: false):
 * an icon and a title on the left, projected actions and a close button on the right. Used by the
 * notice center and the header AI chat so the two top-bar drawers look alike.
 */
@Component({
    standalone: false,
    selector: 'erupt-drawer-header',
    template: `
        <div class="erupt-drawer-header">
            <div class="erupt-drawer-header__title">
                @if (icon) {
                    <span nz-icon [nzType]="icon" nzTheme="outline"></span>
                }
                <span>{{ title }}</span>
            </div>
            <div class="erupt-drawer-header__actions">
                <ng-content></ng-content>
                @if (drawerRef) {
                    <button nz-button nzType="text" nzSize="small" (click)="drawerRef.close()">
                        <span nz-icon nzType="close"></span>
                    </button>
                }
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            flex-shrink: 0;
        }

        .erupt-drawer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid var(--ant-border-color-split);
            flex-shrink: 0;
        }

        .erupt-drawer-header__title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 16px;
            font-weight: 500;
            color: var(--erupt-text, #262626);
        }

        .erupt-drawer-header__actions {
            display: flex;
            align-items: center;
            gap: 4px;
        }
    `]
})
export class DrawerHeaderComponent {

    @Input() icon: string;

    @Input() title: string;

    constructor(@Optional() public drawerRef: NzDrawerRef) {
    }

}
