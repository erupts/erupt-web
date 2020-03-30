import {Component, HostBinding, Input, ElementRef, AfterViewInit, Inject} from '@angular/core';
import {DataService} from "@shared/service/data.service";
import {Router} from "@angular/router";
import {NzMessageService} from "ng-zorro-antd";
import {MenuService} from "@delon/theme";
import {Menu} from "@delon/theme/src/services/menu/interface";

@Component({
    selector: 'header-search',
    template: `
        <!--(keydown.enter)="toMenu()"-->
        <nz-input-group [nzSuffix]="suffixTemplateInfo">
            <input nz-input [(ngModel)]="text" (focus)="qFocus()" (blur)="qBlur()"
                   (input)="onInput($event)"
                   [placeholder]="'搜索'" [nzAutocomplete]="auto" style="padding-left: 15px">
            <nz-autocomplete #auto [nzBackfill]="true">
                <nz-auto-option *ngFor="let menu of options" [nzValue]="menu.name"
                                [nzLabel]="menu.name">
                    <i *ngIf="menu.icon" [class]="menu.icon"></i>
                    <i *ngIf="!menu.icon" nz-icon nzType="unordered-list" nzTheme="outline"></i>
                    &nbsp; {{ menu.name }}
                </nz-auto-option>
            </nz-autocomplete>
        </nz-input-group>
        <ng-template #prefixTemplateInfo>
            <i nz-icon nzType="search" nzTheme="outline"
               [ngStyle]="{color:focus?'#000':'#fff'}"></i>&nbsp;&nbsp;
        </ng-template>
        <ng-template #suffixTemplateInfo>
            <i nz-icon nzType="arrow-right" nzTheme="outline" *ngIf="text" (click)="toMenu()"
               style="cursor: pointer;transition:.5s all"
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

    menuList: any[];

    options: any[] = [];

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
                private dataService: DataService) {
    }

    ngAfterViewInit() {
        this.dataService.getMenuList().subscribe((res) => {
            this.menuList = res;
            console.log(res)
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

    toMenu() {
        console.log(this.text);
        let menu: Menu = this.menuSrv.getItem(this.text);
        if (!menu) {
            this.msg.warning("请选择有效菜单！");
            return;
        }
        this.router.navigateByUrl(menu.link);
        this.text = null;
    }
}
