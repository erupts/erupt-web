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
import {
    ActivatedRoute,
    NavigationCancel,
    NavigationEnd,
    NavigationError,
    RouteConfigLoadStart,
    Router
} from "@angular/router";
import {NzIconService, NzMessageService} from "ng-zorro-antd";
import {Subscription} from "rxjs";
import {updateHostClass} from "@delon/util";
import {Menu, MenuIcon, MenuService, ScrollService, SettingsService} from "@delon/theme";
import {
    AppstoreOutline,
    ArrowDownOutline,
    BellOutline,
    EllipsisOutline,
    FullscreenExitOutline,
    FullscreenOutline,
    GithubOutline,
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
import {WindowModel} from "@shared/model/window.model";
import {environment} from "@env/environment";
import {SettingDrawerComponent} from "./setting-drawer/setting-drawer.component";

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
    ArrowDownOutline,
    // Optional
    GithubOutline,
    AppstoreOutline
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

    // @HostBinding("@mainPageSwitchTransition") state = "activated";

    private notify$: Subscription;

    isFetching = false;

    nowYear = new Date().getFullYear();

    routerReuse: boolean = WindowModel.routerReuse;

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
                public route: ActivatedRoute,
                public data: DataService,
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
                    _message.error(`无法加载${evt.url}路由`, {nzDuration: 1000 * 3});
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
        this.data.getMenu().subscribe(result => {
            function gcMenu(nodes) {
                const tempNodes = [];
                nodes.forEach(node => {
                    let icon: MenuIcon = null;
                    if (node.data.icon) {
                        icon = {
                            type: "class",
                            value: node.data.icon
                        };
                    } else {
                        icon = {
                            type: "icon",
                            value: "unordered-list"
                        };
                    }
                    let option: Menu = {
                        text: node.data.name,
                        key: node.data.name,
                        linkExact: true,
                        // externalLink: "/assets/page/a.html",
                        // target:"_blank",
                        link: node.data.path,
                        hide: node.data.status == 2 && true,
                        icon: icon
                    };
                    if (node.children && node.children.length > 0) {
                        tempNodes.push(option);
                        option.children = gcMenu(node.children);
                    } else {
                        tempNodes.push(option);
                    }
                });
                return tempNodes;
            }

            this.menuSrv.add([{
                group: false,
                hideInBreadcrumb: true,
                text: "~",
                children: gcMenu(result)
            }]);
            this.router.navigateByUrl(this.router.url).then();

            let menuEle = this.el.nativeElement.getElementsByClassName("sidebar-nav__item");
            for (let i = 0; i < menuEle.length; i++) {
                let ele = menuEle.item(i);
                ele.style.position = "relative";
                ele.style.overflow = "hidden";
                ele.addEventListener("click", (e) => {
                    e.stopPropagation();
                    let spanRipper = document.createElement("span");
                    spanRipper.className = "ripple";
                    spanRipper.style.left = e.offsetX+"px";
                    spanRipper.style.top = e.offsetY+"px";
                    ele.appendChild(spanRipper);
                    setTimeout(() => {
                        ele.removeChild(spanRipper)
                    }, 800);
                })
            }
        });

    }

    ngOnDestroy() {
        this.notify$.unsubscribe();
    }
}
