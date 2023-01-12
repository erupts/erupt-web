import {AfterViewInit, Component, ElementRef, HostBinding, Inject, Input} from '@angular/core';
import {DataService} from "@shared/service/data.service";
import {Router} from "@angular/router";
import {MenuService} from "@delon/theme";
import {MenuVo} from "@shared/model/erupt-menu";
import {StatusService} from "@shared/service/status.service";
import {NzMessageService} from "ng-zorro-antd/message";
import {generateMenuPath} from "@shared/util/erupt.util";

@Component({
    selector: 'header-search',
    template: `
        <nz-input-group [nzSuffix]="suffixTemplateInfo" [nzPrefix]="prefixTemplateInfo">
            <input nz-input [(ngModel)]="text" (focus)="qFocus()" (blur)="qBlur()" (input)="onInput($event)"
                   [placeholder]="'global.search.hint'|translate" [nzAutocomplete]="auto">
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
    `,
})
export class HeaderSearchComponent implements AfterViewInit {

    text: any;

    qIpt: HTMLInputElement;

    @HostBinding('class.alain-default__search-focus')
    focus = false;

    @HostBinding('class.alain-default__search-toggled')
    searchToggled = false;

    menuList: MenuVo[];

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
                private msg: NzMessageService,
                public menuSrv: MenuService,
                private statusService: StatusService,
                private dataService: DataService) {
    }

    ngAfterViewInit() {
        this.dataService.getMenu().subscribe((res) => {
            this.menuList = res;
        });
        this.qIpt = (this.el.nativeElement as HTMLElement).querySelector('.ant-input') as HTMLInputElement;
    }

    onInput(event) {
        let value = event.target.value;
        if (!value) {
            return;
        }
        this.options = this.menuList.filter((ml) => {
            return (<string>ml.name).toLocaleLowerCase().indexOf(value.toLowerCase()) !== -1;
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
}
