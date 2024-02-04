import {AfterViewInit, Component, ElementRef, HostBinding, Inject, Input} from '@angular/core';
import {Router} from "@angular/router";
import {MenuTypeEnum, MenuVo} from "@shared/model/erupt-menu";
import {NzMessageService} from "ng-zorro-antd/message";
import {generateMenuPath} from "@shared/util/erupt.util";

@Component({
    selector: 'header-search',
    template: `
        <ng-container *ngIf="menu">
            <nz-input-group [nzSuffix]="suffixTemplateInfo" [nzPrefix]="prefixTemplateInfo">
                <input nz-input autofocus [(ngModel)]="text" (focus)="qFocus()" (blur)="qBlur()" (input)="onInput($event)"
                       [placeholder]="'global.search.hint'|translate" [nzAutocomplete]="auto"
                       (keydown.enter)="search($event)">
                <nz-autocomplete #auto [nzBackfill]="false">
                    <nz-auto-option *ngFor="let menu of options" [nzValue]="menu.name"
                                    [nzLabel]="menu.name" (click)="toMenu(menu)" [nzDisabled]="!menu.value">
                        <i *ngIf="menu.icon" [class]="menu.icon"></i>
                        <i *ngIf="!menu.icon" nz-icon nzType="unordered-list" nzTheme="outline"></i>
                        &nbsp; {{ menu.name }}
                    </nz-auto-option>
                </nz-autocomplete>
            </nz-input-group>
            <ng-template #prefixTemplateInfo>
                <i nz-icon nzType="search" nzTheme="outline"
                   [ngStyle]="{color:focus?'#000':'#999'}" style="margin-top: 2px;transition: all 500ms"></i>&nbsp;&nbsp;
            </ng-template>
            <ng-template #suffixTemplateInfo>
                <i nz-icon nzType="arrow-right" nzTheme="outline" *ngIf="text"
                   style="cursor: pointer;transition:.5s all;"
                   [ngStyle]="{color:focus?'#000':'#fff'}"></i>
            </ng-template>
        </ng-container>
    `,
})
export class HeaderSearchComponent implements AfterViewInit {

    @Input() menu: MenuVo[];

    text: any;

    qIpt: HTMLInputElement;

    @HostBinding('class.alain-default__search-focus')
    focus = false;

    @HostBinding('class.alain-default__search-toggled')
    searchToggled = false;

    options: MenuVo[] = [];

    @Input()
    set toggleChange(value: boolean) {
        if (typeof value === 'undefined') return;
        this.searchToggled = true;
        this.focus = true;
        setTimeout(() => this.qIpt.focus(), 300);
    }

    constructor(private el: ElementRef,
                private router: Router,
                @Inject(NzMessageService)
                private msg: NzMessageService) {
    }

    ngAfterViewInit() {
        this.qIpt = (this.el.nativeElement as HTMLElement).querySelector('.ant-input') as HTMLInputElement;
    }

    onInput(event) {
        let value = event.target.value;
        if (!value) {
            return;
        }
        this.options = this.menu.filter((ml) => {
            if (ml.type == MenuTypeEnum.button || ml.type == MenuTypeEnum.api) {
                return false;
            }
            return ml.name.toLocaleLowerCase().indexOf(value.toLowerCase()) !== -1;
        }) || [];
    }

    qFocus() {
        this.focus = true;
    }

    qBlur() {
        this.focus = false;
        this.searchToggled = false;
    }

    toMenu(menu: MenuVo) {
        if (!menu.value) return;
        this.router.navigateByUrl(generateMenuPath(menu.type, menu.value));
        this.text = null;
    }

    search(event) {
        if (this.text) {
            let r = this.menu.filter((ml) => {
                return ml.name.toLocaleLowerCase().indexOf(this.text.toLocaleLowerCase()) !== -1;
            }) || []
            if (r[0]) {
                this.toMenu(r[0])
            }
        }
    }

}
