import {Direction, Directionality} from '@angular/cdk/bidi';
import {Platform} from '@angular/cdk/platform';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Optional,
    Renderer2,
    TemplateRef,
    ViewEncapsulation
} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter, merge, Subject, takeUntil} from 'rxjs';

import {ReuseTabService} from '@delon/abc/reuse-tab';
import {Menu, MenuService, SettingsService, TitleService} from '@delon/theme';
import {AlainConfigService} from '@delon/util/config';
import {InputBoolean, InputNumber} from '@delon/util/decorator';
import type {NzSafeAny} from 'ng-zorro-antd/core/types';
import {I18NService} from "@core";

interface PageHeaderPath {
    title?: string;
    link?: string[];
    icon?: string;
}

@Component({
    selector: 'erupt-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.less'],
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class NavComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

    private destroy$ = new Subject<void>();

    inited = false;

    isBrowser = true;

    dir: Direction = 'ltr';

    private get menus(): Menu[] {
        return this.menuSrv.getPathByUrl(this.router.url, this.recursiveBreadcrumb);
    }

    _titleVal: string | null = '';
    paths: PageHeaderPath[] = [];

    // #region fields

    _title: string | null = null;
    _titleTpl: TemplateRef<NzSafeAny> | null = null;

    @Input()
    set title(value: string | TemplateRef<void> | null) {
        if (value instanceof TemplateRef) {
            this._title = null;
            this._titleTpl = value;
            this._titleVal = '';
        } else {
            this._title = value;
            this._titleVal = this._title;
        }
    }

    @Input() @InputBoolean() loading = false;
    @Input() @InputBoolean() wide = false;
    @Input() home?: string;
    @Input() homeLink?: string;
    @Input() homeI18n?: string;
    @Input() @InputBoolean() autoBreadcrumb!: boolean;
    @Input() @InputBoolean() autoTitle!: boolean;
    @Input() @InputBoolean() syncTitle!: boolean;
    @Input() @InputBoolean() fixed!: boolean;
    @Input() @InputNumber() fixedOffsetTop!: number;
    @Input() breadcrumb?: TemplateRef<NzSafeAny> | null = null;
    @Input() @InputBoolean() recursiveBreadcrumb!: boolean;
    @Input() logo?: TemplateRef<void> | null = null;
    @Input() action?: TemplateRef<void> | null = null;
    @Input() content?: TemplateRef<void> | null = null;
    @Input() extra?: TemplateRef<void> | null = null;
    @Input() tab?: TemplateRef<void> | null = null;

    // #endregion

    constructor(
        settings: SettingsService,
        private renderer: Renderer2,
        private router: Router,
        private menuSrv: MenuService,
        @Optional() @Inject(TitleService) private titleSrv: TitleService,
        @Optional() @Inject(ReuseTabService) private reuseSrv: ReuseTabService,
        private cdr: ChangeDetectorRef,
        configSrv: AlainConfigService,
        platform: Platform,
        @Optional() private directionality: Directionality,
        private i18n: I18NService
    ) {
        this.isBrowser = platform.isBrowser;
        configSrv.attach(this, 'pageHeader', {
            home: this.i18n.fanyi("global.home"),
            homeLink: '/',
            autoBreadcrumb: true,
            recursiveBreadcrumb: false,
            autoTitle: true,
            syncTitle: true,
            fixed: false,
            fixedOffsetTop: 64
        });

        merge(menuSrv.change, router.events.pipe(filter(ev => ev instanceof NavigationEnd)))
            .pipe(
                filter(() => this.inited),
                takeUntil(this.destroy$)
            )
            .subscribe(() => this.refresh());
    }

    refresh(): void {
        this.setTitle().genBreadcrumb();
        this.cdr.detectChanges();
    }

    private genBreadcrumb(): void {
        if (this.breadcrumb || !this.autoBreadcrumb || this.menus.length <= 0) {
            this.paths = [];
            return;
        }
        const paths: PageHeaderPath[] = [];
        this.menus.forEach(item => {
            if (typeof item.hideInBreadcrumb !== 'undefined' && item.hideInBreadcrumb) return;
            let title = item.text;
            if (item.i18n && this.i18n) title = this.i18n.fanyi(item.i18n);
            paths.push({
                title: title,
                link: (item.link && [item.link]) as string[],
                icon: item.icon ? item.icon['value'] : null
            });
        });
        // add home
        if (this.home) {
            paths.splice(0, 0, {
                title: this.home,
                icon: 'fa fa-home',
                link: [this.homeLink!]
            });
        }
        this.paths = paths;
    }

    private setTitle(): this {
        if (this._title == null && this._titleTpl == null && this.autoTitle && this.menus.length > 0) {
            const item = this.menus[this.menus.length - 1];
            let title = item.text;
            if (item.i18n && this.i18n) {
                title = this.i18n.fanyi(item.i18n);
            }
            this._titleVal = title!;
        }

        if (this._titleVal && this.syncTitle) {
            if (this.titleSrv) {
                this.titleSrv.setTitle(this._titleVal);
            }
            if (!this.inited && this.reuseSrv) {
                this.reuseSrv.title = this._titleVal;
            }
        }

        return this;
    }

    ngOnInit(): void {
        this.dir = this.directionality.value;
        this.directionality.change?.pipe(takeUntil(this.destroy$)).subscribe((direction: Direction) => {
            this.dir = direction;
            this.cdr.detectChanges();
        });
        this.refresh();
        this.inited = true;
    }

    ngAfterViewInit(): void {
    }

    ngOnChanges(): void {
        if (this.inited) {
            this.refresh();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

}
