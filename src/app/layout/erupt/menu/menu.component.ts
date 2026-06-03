import {Direction, Directionality} from '@angular/cdk/bidi';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {DOCUMENT} from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Inject,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    Optional,
    Output,
    Renderer2,
    ViewEncapsulation
} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {NavigationEnd, Router} from '@angular/router';
import {filter, Subject, takeUntil} from 'rxjs';

import {Menu, MenuIcon, MenuInner, MenuService, SettingsService} from '@delon/theme';
import {ZoneOutside} from '@delon/util/decorator';
import {WINDOW} from '@delon/util/token';
import type {NzSafeAny} from 'ng-zorro-antd/core/types';
import {AppViewService} from "@shared/service/app-view.service";

export interface Nav extends MenuInner {
    _needIcon?: boolean;
    _text?: SafeHtml;
}

const SHOWCLS = 'sidebar-nav__floating-show';
const FLOATINGCLS = 'sidebar-nav__floating';

@Component({
    standalone: false,
    selector: 'erupt-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.less'],
    host: {
        '(click)': '_click()',
        '(document:click)': 'closeSubMenu()',
        '[class.d-block]': `true`
    },
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class MenuComponent implements OnInit, OnDestroy {

    private bodyEl!: HTMLBodyElement;

    private destroy$ = new Subject<void>();

    private floatingEl!: HTMLDivElement;

    dir: Direction = 'ltr';

    list: Nav[] = [];

    loading: boolean = true;

    @Input() disabledAcl = false;

    @Input() autoCloseUnderPad = true;

    @Input() recursivePath = true;

    @Input()
    set openStrictly(value: boolean) {
        this.menuSrv.openStrictly = value;
    }

    @Input() maxLevelIcon = 3;

    @Output() readonly select = new EventEmitter<Menu>();

    private static readonly MENU_ORDER_KEY = 'erupt_menu_order';
    private static readonly FAVORITES_KEY = 'erupt_menu_favorites';

    favorites: Nav[] = [];

    get collapsed(): boolean {
        return this.settings.layout.collapsed;
    }

    constructor(
        private menuSrv: MenuService,
        private settings: SettingsService,
        private router: Router,
        private render: Renderer2,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone,
        private sanitizer: DomSanitizer,
        private appViewService: AppViewService,
        @Inject(DOCUMENT) private doc: NzSafeAny,
        @Inject(WINDOW) private win: NzSafeAny,
        @Optional() private directionality: Directionality
    ) {
    }

    private getLinkNode(node: HTMLElement): HTMLElement | null {
        node = node.nodeName === 'A' ? node : (node.parentNode as HTMLElement);
        return node.nodeName !== 'A' ? null : node;
    }

    private floatingClickHandle(e: MouseEvent): boolean {
        e.stopPropagation();
        const linkNode = this.getLinkNode(e.target as HTMLElement);
        if (linkNode == null) {
            return false;
        }
        const id = +linkNode.dataset!['id']!;
        // Should be ingore children title trigger event
        if (isNaN(id)) {
            return false;
        }

        let item: Nav;
        this.menuSrv.visit(this.list, (i: Nav) => {
            if (!item && i._id === id) {
                item = i;
            }
        });
        this.to(item!);
        this.hideAll();
        e.preventDefault();
        return false;
    }

    private clearFloating(): void {
        if (!this.floatingEl) return;
        this.floatingEl.removeEventListener('click', this.floatingClickHandle.bind(this));
        // fix ie: https://github.com/ng-alain/delon/issues/52
        if (this.floatingEl.hasOwnProperty('remove')) {
            this.floatingEl.remove();
        } else if (this.floatingEl.parentNode) {
            this.floatingEl.parentNode.removeChild(this.floatingEl);
        }
    }

    private genFloating(): void {
        this.clearFloating();
        this.floatingEl = this.render.createElement('div');
        this.floatingEl.classList.add(`${FLOATINGCLS}-container`);
        this.floatingEl.addEventListener('click', this.floatingClickHandle.bind(this), false);
        this.bodyEl.appendChild(this.floatingEl);
    }

    private genSubNode(linkNode: HTMLLinkElement, item: Nav): HTMLUListElement {
        const id = `_sidebar-nav-${item._id}`;
        const childNode = item.badge ? linkNode.nextElementSibling!.nextElementSibling! : linkNode.nextElementSibling!;
        const node = childNode.cloneNode(true) as HTMLUListElement;
        node.id = id;
        node.classList.add(FLOATINGCLS);
        node.addEventListener(
            'mouseleave',
            () => {
                node.classList.remove(SHOWCLS);
            },
            false
        );
        this.floatingEl.appendChild(node);
        return node;
    }

    private hideAll(): void {
        const allNode = this.floatingEl.querySelectorAll(`.${FLOATINGCLS}`);
        for (let i = 0; i < allNode.length; i++) {
            allNode[i].classList.remove(SHOWCLS);
        }
    }

    // calculate the node position values.
    private calPos(linkNode: HTMLLinkElement, node: HTMLUListElement): void {
        const rect = linkNode.getBoundingClientRect();
        // bug: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/14721015/
        const scrollTop = Math.max(this.doc.documentElement.scrollTop, this.bodyEl.scrollTop);
        const docHeight = Math.max(this.doc.documentElement.clientHeight, this.bodyEl.clientHeight);
        const spacing = 5;
        let offsetHeight = -spacing;
        if (docHeight < rect.top + node.clientHeight) {
            offsetHeight = rect.top + node.clientHeight - docHeight + spacing;
        }
        node.style.top = `${rect.top + scrollTop - offsetHeight}px`;
        if (this.dir === 'rtl') {
            node.style.right = `${rect.width + spacing}px`;
        } else {
            node.style.left = `${rect.right + spacing}px`;
        }
    }

    @ZoneOutside()
    showSubMenu(e: MouseEvent, item: Nav): void {
        if (this.collapsed !== true) {
            return;
        }
        e.preventDefault();
        const linkNode = e.target as Element;
        this.genFloating();
        const subNode = this.genSubNode(linkNode as HTMLLinkElement, item);
        this.hideAll();
        subNode.classList.add(SHOWCLS);
        this.calPos(linkNode as HTMLLinkElement, subNode);
    }

    to(item: Menu): void {
        this.select.emit(item);
        if (item.disabled) return;

        if (item.externalLink) {
            if (item.target === '_blank') {
                this.win.open(item.externalLink);
            } else {
                this.win.location.href = item.externalLink;
            }
            return;
        }
        this.appViewService.setRouterViewDesc(null)
        this.ngZone.run(() => this.router.navigateByUrl(item.link!));
    }

    toggleOpen(item: Nav): void {
        this.menuSrv.toggleOpen(item);
    }

    _click(): void {
        if (this.isPad && this.collapsed) {
            this.openAside(false);
            this.hideAll();
        }
    }

    closeSubMenu(): void {
        if (this.collapsed) {
            this.hideAll();
        }
    }

    private openByUrl(url: string | null): void {
        const {menuSrv, recursivePath} = this;
        this.menuSrv.open(menuSrv.find({url, recursive: recursivePath}));
    }

    ngOnInit(): void {
        const {doc, router, destroy$, menuSrv, settings, cdr} = this;
        this.bodyEl = doc.querySelector('body');
        menuSrv.change.pipe(takeUntil(destroy$)).subscribe(data => {
            menuSrv.visit(data, (i: Nav, _p, depth) => {
                i._text = this.sanitizer.bypassSecurityTrustHtml(i.text!);
                i._needIcon = depth! <= this.maxLevelIcon && !!i.icon;
                if (!i._aclResult) {
                    if (this.disabledAcl) {
                        i.disabled = true;
                    } else {
                        i._hidden = true;
                    }
                }
                const icon = i.icon as MenuIcon;
                if (icon && icon.type === 'svg' && typeof icon.value === 'string') {
                    icon.value = this.sanitizer.bypassSecurityTrustHtml(icon.value!!);
                }
            });
            this.fixHide(data);
            this.loading = false;
            this.list = data.filter((w: Nav) => w._hidden !== true);
            this.restoreMenuOrder();
            this.loadFavorites();
            cdr.detectChanges();
        });
        router.events.pipe(takeUntil(destroy$)).subscribe(e => {
            if (e instanceof NavigationEnd) {
                this.openByUrl(e.urlAfterRedirects);
                this.underPad();
                this.cdr.detectChanges();
            }
        });
        settings.notify
            .pipe(
                takeUntil(destroy$),
                filter(t => t.type === 'layout' && t.name === 'collapsed')
            )
            .subscribe(() => this.clearFloating());
        this.underPad();

        this.dir = this.directionality.value;
        this.directionality.change?.pipe(takeUntil(destroy$)).subscribe((direction: Direction) => {
            this.dir = direction;
        });
        this.openByUrl(router.url);
        this.ngZone.runOutsideAngular(() => this.genFloating());
    }

    private fixHide(ls: Nav[]): void {
        const inFn = (list: Nav[]): void => {
            for (const item of list) {
                if (item.children && item.children.length > 0) {
                    inFn(item.children);
                    if (!item._hidden) {
                        item._hidden = item.children.every((v: Nav) => v._hidden);
                    }
                }
            }
        };

        inFn(ls);
    }

    // #region Favorites

    private loadFavorites(): void {
        const keys: string[] = JSON.parse(localStorage.getItem(MenuComponent.FAVORITES_KEY) || '[]');
        if (!keys.length) {
            this.favorites = [];
            return;
        }
        const map = new Map<string, Nav>();
        this.menuSrv.visit(this.list, (i: Nav) => {
            const key = i.link || i.text || '';
            if (keys.includes(key)) map.set(key, i);
        });
        this.favorites = keys.map(k => map.get(k)).filter(Boolean);
    }

    private saveFavorites(): void {
        const keys = this.favorites.map(i => i.link || i.text || '');
        localStorage.setItem(MenuComponent.FAVORITES_KEY, JSON.stringify(keys));
    }

    isFavorite(item: Nav): boolean {
        const key = item.link || item.text || '';
        return this.favorites.some(f => (f.link || f.text || '') === key);
    }

    toggleFavorite(item: Nav): void {
        if (this.isFavorite(item)) {
            this.favorites = this.favorites.filter(f => (f.link || f.text || '') !== (item.link || item.text || ''));
        } else {
            this.favorites = [...this.favorites, item];
        }
        this.saveFavorites();
        this.cdr.detectChanges();
    }

    dropFavorite(event: CdkDragDrop<Nav[]>): void {
        moveItemInArray(this.favorites, event.previousIndex, event.currentIndex);
        this.saveFavorites();
        this.cdr.detectChanges();
    }

    // #endregion

    // #region Drag & Drop

    drop(event: CdkDragDrop<Nav[]>, siblings: Nav[]): void {
        moveItemInArray(siblings, event.previousIndex, event.currentIndex);
        this.saveMenuOrder();
        this.cdr.detectChanges();
    }

    private saveMenuOrder(): void {
        const order: Record<string, number> = {};
        const collect = (items: Nav[], prefix: string) => {
            items.forEach((item, idx) => {
                const key = prefix + (item.text || item.link || idx);
                order[key] = idx;
                if (item.children?.length) {
                    collect(item.children, key + '/');
                }
            });
        };
        collect(this.list, '');
        localStorage.setItem(MenuComponent.MENU_ORDER_KEY, JSON.stringify(order));
    }

    private restoreMenuOrder(): void {
        const raw = localStorage.getItem(MenuComponent.MENU_ORDER_KEY);
        if (!raw) return;
        try {
            const order: Record<string, number> = JSON.parse(raw);
            const sort = (items: Nav[], prefix: string) => {
                items.sort((a, b) => {
                    const ka = prefix + (a.text || a.link || '');
                    const kb = prefix + (b.text || b.link || '');
                    const oa = order[ka] ?? 999;
                    const ob = order[kb] ?? 999;
                    return oa - ob;
                });
                items.forEach((item, idx) => {
                    const key = prefix + (item.text || item.link || idx);
                    if (item.children?.length) {
                        sort(item.children, key + '/');
                    }
                });
            };
            sort(this.list, '');
        } catch {
        }
    }

    // #endregion

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.clearFloating();
    }

    // #region Under pad

    private get isPad(): boolean {
        return this.doc.defaultView!.innerWidth < 768;
    }

    private underPad(): void {
        if (this.autoCloseUnderPad && this.isPad && !this.collapsed) {
            setTimeout(() => this.openAside(true));
        }
    }

    private openAside(status: boolean): void {
        this.settings.setLayout('collapsed', status);
    }

    // #endregion
}
