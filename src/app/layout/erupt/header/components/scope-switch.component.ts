import {Component, OnDestroy, OnInit} from "@angular/core";
import {filter, Subscription} from "rxjs";
import {NavigationEnd, Router} from "@angular/router";
import {ScopeService, ScopeView} from "@shared/service/scope.service";

/**
 * The scope pickers in the page header, one per scope of the current page's model.
 */
@Component({
    standalone: false,
    selector: "header-scope-switch",
    template: `
        @for (s of shown; track s.name) {
            <div class="alain-default__nav-item scope-trigger" [class.scope-trigger--empty]="!scopeService.current(s.name)"
                 nz-popover nzPopoverTrigger="click" nzPopoverPlacement="bottomLeft" nzPopoverOverlayClassName="scope-popover"
                 [nzPopoverTitle]="s.title" [nzPopoverContent]="form"
                 [nzPopoverVisible]="open[s.name]" (nzPopoverVisibleChange)="open[s.name] = $event">
                <i nz-icon nzType="cluster" nzTheme="outline"></i>
                <span class="scope-trigger__title">{{ s.title }}</span>
                <span class="scope-trigger__value">{{ scopeService.summary(s.name) || ('scope.pick' | translate) }}</span>
                <i nz-icon nzType="down" class="scope-trigger__caret"></i>
            </div>
            <ng-template #form>
                <scope-form-host [scope]="s" [closable]="true" (closed)="open[s.name] = false"></scope-form-host>
            </ng-template>
        }
    `,
    styles: [`
        :host { display: flex; align-items: center; gap: 8px; }
        .scope-trigger { margin-left: 12px; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border-radius: 6px;
            border: 1px solid rgba(15, 143, 122, .55); background: rgba(15, 143, 122, .12); cursor: pointer; white-space: nowrap; }
        .scope-trigger--empty { border-style: dashed; border-color: #d48806; background: rgba(212, 136, 6, .1); }
        .scope-trigger__title { opacity: .7; font-size: 12px; }
        .scope-trigger__value { max-width: 260px; overflow: hidden; text-overflow: ellipsis; font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; }
        .scope-trigger__caret { font-size: 10px; opacity: .7; }
    `]
})
export class ScopeSwitchComponent implements OnInit, OnDestroy {

    open: { [scope: string]: boolean } = {};

    private url: string;

    private route$: Subscription;

    constructor(public scopeService: ScopeService, private router: Router) {
    }

    ngOnInit(): void {
        this.route$ = this.router.events.pipe(filter(e => e instanceof NavigationEnd))
            .subscribe((e: NavigationEnd) => this.url = e.urlAfterRedirects);
        this.url = this.router.url;
    }

    ngOnDestroy(): void {
        this.route$?.unsubscribe();
    }

    get shown(): ScopeView[] {
        return this.scopeService.of(this.url);
    }

}
