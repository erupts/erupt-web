import {
    AfterViewInit,
    Component,
    ElementRef,
    Inject,
    OnDestroy,
    OnInit,
    Optional,
    Renderer2,
    ViewChild,
    ViewContainerRef
} from "@angular/core";
import {IframeManagerService} from "@shared/service/iframe-manager.service";
import {DOCUMENT} from "@angular/common";
import {NavigationCancel, NavigationEnd, NavigationError, RouteConfigLoadStart, Router} from "@angular/router";

import {Observable, Subscription} from "rxjs";
import {ScrollService, updateHostClass} from "@delon/util";
import {Menu, MenuService, SettingsService} from "@delon/theme";
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
import {generateMenuPath} from "@shared/util/erupt.util";
import {MenuTypeEnum, MenuVo} from "@shared/model/erupt-menu";
import {I18NService} from "@core";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzIconService} from "ng-zorro-antd/icon";
import {ResetPwdComponent} from "../../routes/reset-pwd/reset-pwd.component";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {Userinfo} from "@shared/model/user.model";
import {UtilsService} from "@shared/service/utils.service";
import {SocketService} from "@shared/service/socket.service";

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
    standalone: false,
    selector: "layout-erupt",
    templateUrl: "./erupt.component.html",
    preserveWhitespaces: false,
    host: {
        "[class.alain-default]": "true"
    },
    styleUrls: [
        "./erupt.component.less"
    ]
    // animations: [mainPageSwitchTransition]
})
export class LayoutEruptComponent implements OnInit, AfterViewInit, OnDestroy {

    private notify$: Subscription;

    isFetching = false;

    nowYear = new Date().getFullYear();

    menu: MenuVo[];

    @ViewChild("settingHost", {read: ViewContainerRef, static: false})
    settingHost: ViewContainerRef;

    @ViewChild("iframeHost", {static: true})
    iframeHost: ElementRef<HTMLElement>;

    themes = [];

    nickName: string | null = null;

    constructor(iconSrv: NzIconService,
                private router: Router,
                scroll: ScrollService,
                _message: NzMessageService,
                public menuSrv: MenuService,
                public settings: SettingsService,
                private el: ElementRef,
                private renderer: Renderer2,
                public settingSrv: SettingsService,
                public data: DataService,
                private settingsService: SettingsService,
                @Inject(NzModalService)
                private modal: NzModalService,
                private socketService: SocketService,
                private i18n: I18NService,
                private utilsService: UtilsService,
                private iframeManager: IframeManagerService,
                @Optional()
                @Inject(ReuseTabService)
                private reuseTabService: ReuseTabService,
                @Inject(DOCUMENT) private doc: any) {
        iconSrv.addIcon(...ICONS);
        let initReuseTab = false;
        // this.themes = [
        //     {key: 'default', text: this.i18n.fanyi("theme.default")},
        //     {key: 'dark', text: this.i18n.fanyi("theme.dark")},
        //     {key: 'compact', text: this.i18n.fanyi("theme.compact")},
        // ]
        router.events.subscribe(evt => {
            if (!this.isFetching && evt instanceof RouteConfigLoadStart) {
                this.isFetching = true;
            }
            if (!initReuseTab) {
                this.reuseTabService.clear();
                initReuseTab = true;
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
            const navUrl = (evt as NavigationEnd).urlAfterRedirects || (evt as NavigationEnd).url;
            const isManagedRoute = navUrl.startsWith('/site/')
                || navUrl.startsWith('/tpl/');
            if (!isManagedRoute) {
                this.iframeManager.hideAll();
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
                [`alain-default__fixed`]: layout['fixed'],
                [`alain-default__boxed`]: layout['boxed'],
                [`alain-default__collapsed`]: layout.collapsed
            },
            true
        );
        this.doc.documentElement.classList[layout["colorGray"] ? "add" : "remove"]("color-gray");
        this.doc.documentElement.classList[layout.colorWeak ? "add" : "remove"]("color-weak");
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.reuseTabService.clear(true);
        }, 500)
    }

    ngOnInit() {
        this.iframeManager.setContainer(this.iframeHost.nativeElement);
        if (!!EruptAppData.get().properties["erupt-websocket"]) {
            this.socketService.initWebSocket();
        }
        this.notify$ = this.settings.notify.subscribe(() => this.setClass());
        this.setClass();
        this.data.getMenu().subscribe(res => {
            this.menu = res;

            // this.statusService.menus = res;
            const hiddenMenus: Menu[] = [];
            function generateTree(menus, pid): Menu[] {
                let result: Menu[] = [];
                menus.forEach((menu) => {
                    if (menu.type === MenuTypeEnum.api || menu.type === MenuTypeEnum.button) {
                        hiddenMenus.push({text: menu.name, key: menu.code, hide: true});
                        return;
                    }
                    if (menu.pid == pid) {
                        let option: Menu = {
                            text: menu.name,
                            key: menu.code,
                            i18n: menu.name,
                            linkExact: true,
                            icon: menu.icon || (menu.pid ? null : 'fa fa-list-ul'),
                            link: generateMenuPath(menu.type, menu.value),
                            children: generateTree(menus, menu.id)
                        };
                        if (menu.type == MenuTypeEnum.newWindow) {
                            option.target = "_blank";
                            option.externalLink = menu.value;
                        } else if (menu.type == MenuTypeEnum.selfWindow) {
                            option.target = "_self";
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
                text: this.i18n.fanyi("global.home"),
                link: "/"
            }]);
            const tree = generateTree(res, null);
            const menuItems: Menu[] = [{
                group: false,
                hideInBreadcrumb: true,
                text: "~",
                children: tree
            }];
            if (hiddenMenus.length) {
                menuItems.push({group: false, hide: true, text: '_hidden', children: hiddenMenus});
            }
            this.menuSrv.add(menuItems);
            this.router.navigateByUrl(this.router.url).then();

            // 将所有菜单元素增加水波纹效果
            let menuEle = this.el.nativeElement.getElementsByClassName("sidebar-nav__item");
            for (let i = 0; i < menuEle.length; i++) {
                let ele = menuEle.item(i);
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
        let userinfoObservable: Observable<Userinfo>;

        if (this.utilsService.isTenantToken()) {
            userinfoObservable = this.data.tenantUserinfo()
        } else {
            userinfoObservable = this.data.userinfo();
        }
        userinfoObservable.subscribe(userinfo => {
            let path = generateMenuPath(userinfo.indexMenuType, userinfo.indexMenuValue);
            const appConfig = EruptAppData.get();
            if (appConfig.waterMark) {
                // 水印内容格式：姓名-自定义内容-日期
                let watermark = userinfo.nickname;
                if (appConfig.waterMarkContent) {
                    watermark += '-' + appConfig.waterMarkContent;
                }
                if (appConfig.waterMarkDate) {
                    const now = new Date();
                    const pad = (n: number) => String(n).padStart(2, '0');
                    watermark += '-' + now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
                }
                this.nickName = watermark;
            }
            this.settingsService.setUser({
                avatar: userinfo.avatar,
                name: userinfo.nickname,
                tenantName: userinfo.tenantName || null,
                indexPath: path
            });
            if (this.router.url === "/") {
                path && this.router.navigateByUrl(path).then();
            }
            if (userinfo.resetPwd && EruptAppData.get().resetPwd) {
                this.modal.create({
                    nzDraggable:true,
                    nzTitle: this.i18n.fanyi("global.reset_pwd"),
                    nzMaskClosable: false,
                    nzClosable: true,
                    nzKeyboard: true,
                    nzContent: ResetPwdComponent,
                    nzFooter: null,
                    nzBodyStyle: {
                        paddingBottom: '1px'
                    }
                });
            }
        });
    }

    ngOnDestroy() {
        this.notify$.unsubscribe();
    }
}

