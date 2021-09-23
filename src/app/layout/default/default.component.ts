import {
    AfterViewInit,
    Component,
    ComponentFactoryResolver,
    ElementRef,
    Inject,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewChild,
    ViewContainerRef
} from "@angular/core";
import {DOCUMENT} from "@angular/common";
import {ActivatedRoute, NavigationCancel, NavigationEnd, NavigationError, RouteConfigLoadStart, Router} from "@angular/router";
import {NzIconService, NzMessageService} from "ng-zorro-antd";
import {Subscription} from "rxjs";
import {updateHostClass} from "@delon/util";
import {ALAIN_I18N_TOKEN, Menu, MenuService, ScrollService, SettingsService} from "@delon/theme";
import {
    ArrowDownOutline,
    BellOutline,
    EllipsisOutline,
    FullscreenExitOutline,
    FullscreenOutline,
    GlobalOutline,
    LockOutline,
    LogoutOutline,
    MenuFoldOutline,
    MenuUnfoldOutline,
    PlusOutline,
    SearchOutline,
    SettingOutline,
    UserOutline
} from "@ant-design/icons-angular/icons";
import {DataService} from "@shared/service/data.service";
import {environment} from "@env/environment";
import {SettingDrawerComponent} from "./setting-drawer/setting-drawer.component";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {generateMenuPath} from "@shared/util/erupt.util";
import {MenuTypeEnum} from "@shared/model/erupt-menu";
import {I18NService} from "@core";

// #region icons

const ICONS = [
    MenuFoldOutline,
    MenuUnfoldOutline,
    SearchOutline,
    SettingOutline,
    FullscreenOutline,
    FullscreenExitOutline,
    BellOutline,
    LockOutline,
    PlusOutline,
    UserOutline,
    LogoutOutline,
    EllipsisOutline,
    GlobalOutline,
    ArrowDownOutline
];

// #endregion

@Component({
    selector: "layout-default",
    templateUrl: "./default.component.html",
    preserveWhitespaces: false,
    host: {
        "[class.alain-default]": "true"
    },
    styleUrls: [
        "./default.component.less"
    ]
    // animations: [mainPageSwitchTransition]
})
export class LayoutDefaultComponent implements OnInit, AfterViewInit, OnDestroy {

    private notify$: Subscription;

    isFetching = false;

    nowYear = new Date().getFullYear();

    @ViewChild("settingHost", {read: ViewContainerRef, static: false})
    settingHost: ViewContainerRef;

    constructor(iconSrv: NzIconService,
                private router: Router,
                scroll: ScrollService,
                _message: NzMessageService,
                private resolver: ComponentFactoryResolver,
                public menuSrv: MenuService,
                public settings: SettingsService,
                private el: ElementRef,
                private renderer: Renderer2,
                public settingSrv: SettingsService,
                public route: ActivatedRoute,
                public data: DataService,
                @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
                @Inject(DOCUMENT) private doc: any) {
        iconSrv.addIcon(...ICONS);
        // scroll to top in change page
        router.events.subscribe(evt => {
            if (!this.isFetching && evt instanceof RouteConfigLoadStart) {
                this.isFetching = true;
            }
            if (evt instanceof NavigationError || evt instanceof NavigationCancel) {
                this.isFetching = false;
                if (evt instanceof NavigationError) {
                    _message.error(`无法加载${evt.url}路由，请刷新页面或清理缓存后重试！`, {nzDuration: 1000 * 3});
                }
                return;
            }
            if (!(evt instanceof NavigationEnd)) {
                return;
            }
            setTimeout(() => {
                scroll.scrollToTop();
                this.isFetching = false;
            }, 1000);
        });
    }

    private setClass() {
        const {el, renderer, settings} = this;
        const layout = settings.layout;
        updateHostClass(
            el.nativeElement,
            renderer,
            {
                ["alain-default"]: true,
                [`alain-default__fixed`]: layout.fixed,
                [`alain-default__boxed`]: layout.boxed,
                [`alain-default__collapsed`]: layout.collapsed
            },
            true
        );

        this.doc.body.classList[layout.colorWeak ? "add" : "remove"]("color-weak");
    }

    ngAfterViewInit(): void {
        // Setting componet for only developer
        if (!environment.production) {
            setTimeout(() => {
                const settingFactory = this.resolver.resolveComponentFactory(
                    SettingDrawerComponent
                );
                this.settingHost.createComponent(settingFactory);
            }, 22);
        }
    }

    ngOnInit() {
        this.notify$ = this.settings.notify.subscribe(() => this.setClass());
        this.setClass();
        //fill menu
        this.data.getMenu().subscribe(res => {
            function generateTree(menus, pid): Menu[] {
                let result: Menu[] = [];
                menus.forEach((menu) => {
                    if (menu.type === MenuTypeEnum.button || menu.type === MenuTypeEnum.api) {
                        return;
                    }
                    if (menu.pid == pid) {
                        let option: Menu = {
                            text: menu.name,
                            key: menu.name,
                            i18n: menu.name,
                            linkExact: true,
                            icon: menu.icon || {
                                type: "icon",
                                value: "unordered-list"
                            },
                            link: generateMenuPath(menu.type, menu.value),
                            children: generateTree(menus, menu.id)
                        };
                        if (menu.type == MenuTypeEnum.newWindow) {
                            option.target = "_blank";
                            option.externalLink = menu.value;
                        }
                        result.push(option);
                    }
                });
                return result;
            }

            this.menuSrv.add([{
                group: false,
                hideInBreadcrumb: true,
                hide: true,
                text: "首页",
                i18n: "global.home",
                link: "/"
            }]);
            this.menuSrv.add([{
                group: false,
                hideInBreadcrumb: true,
                text: "~",
                children: generateTree(res, null)
            }]);
            this.router.navigateByUrl(this.router.url).then();

            //将所有菜单元素增加水波纹效果，动态写入href
            let menuEle = this.el.nativeElement.getElementsByClassName("sidebar-nav__item");
            for (let i = 0; i < menuEle.length; i++) {
                let ele = menuEle.item(i);
                let linkEle = ele.getElementsByClassName("sidebar-nav__item-link")[0];
                if (linkEle) {
                    let menu = this.menuSrv.getItem(linkEle.getElementsByClassName("sidebar-nav__item-text")[0].innerText);
                    if (menu.link) {
                        linkEle.href = "#" + menu.link;
                        linkEle.onclick = function () {
                            return false;
                        };
                    }
                    if (menu.externalLink) {
                        linkEle.href = menu.externalLink;
                    }
                }
                ele.style.position = "relative";
                ele.style.overflow = "hidden";
                ele.addEventListener("click", (e) => {
                    e.stopPropagation();
                    let spanRipper = document.createElement("span");
                    spanRipper.className = "ripple";
                    spanRipper.style.left = e.offsetX + "px";
                    spanRipper.style.top = e.offsetY + "px";
                    ele.appendChild(spanRipper);
                    setTimeout(() => {
                        ele.removeChild(spanRipper);
                    }, 800);
                });
            }

        });
    }

    ngOnDestroy() {
        this.notify$.unsubscribe();
    }
}
