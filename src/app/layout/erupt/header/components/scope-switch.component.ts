import {Component, Inject, OnDestroy, OnInit} from "@angular/core";
import {filter, Subscription} from "rxjs";
import {NavigationEnd, Router} from "@angular/router";
import {NzMessageService} from "ng-zorro-antd/message";
import {DataService} from "@shared/service/data.service";
import {ScopeService, ScopeView} from "@shared/service/scope.service";
import {I18NService} from "@core";
import {EditType} from "../../../../build/erupt/model/erupt.enum";
import {VL} from "../../../../build/erupt/model/erupt-field.model";

interface ScopeField {
    name: string;
    title: string;
    notNull: boolean;
    // a choice is picked from options; any other field is typed
    choice: boolean;
    multiple: boolean;
    // field whose value narrows this one's options (@ChoiceType.dependField)
    depend: string;
    options: VL[];
    loading: boolean;
}

interface ScopeForm {
    fields: ScopeField[];
    values: { [field: string]: any };
}

/**
 * The scope pickers in the page header, drawn with plain controls: a select for a choice, an input
 * for anything else. A scope of one choice switches as soon as a value is picked.
 */
@Component({
    standalone: false,
    selector: "header-scope-switch",
    template: `
        @for (s of shown; track s.name) {
            <div class="alain-default__nav-item scope-trigger" [class.scope-trigger--empty]="!scopeService.current(s.name)"
                 nz-popover nzPopoverTrigger="click" nzPopoverPlacement="bottomLeft" nzPopoverOverlayClassName="scope-popover"
                 [nzPopoverTitle]="s.title" [nzPopoverContent]="form"
                 [nzPopoverVisible]="open[s.name]" (nzPopoverVisibleChange)="toggle(s, $event)">
                <i nz-icon nzType="cluster" nzTheme="outline"></i>
                <span class="scope-trigger__title">{{ s.title }}</span>
                <span class="scope-trigger__value">{{ scopeService.summary(s.name) || ('scope.pick' | translate) }}</span>
                <i nz-icon nzType="down" class="scope-trigger__caret"></i>
            </div>
            <ng-template #form>
                @if (forms[s.name]; as f) {
                    <div class="scope-form">
                        @for (field of f.fields; track field.name) {
                            <label class="scope-form__label" [attr.for]="'scope-' + s.name + '-' + field.name">
                                @if (field.notNull) {
                                    <span class="scope-form__required">*</span>
                                }
                                {{ field.title }}
                            </label>
                            @if (!field.choice) {
                                <input nz-input [id]="'scope-' + s.name + '-' + field.name" [(ngModel)]="f.values[field.name]"
                                       (keydown.enter)="submit(s)">
                            } @else {
                            <nz-select [nzId]="'scope-' + s.name + '-' + field.name" style="width: 100%" nzShowSearch
                                       [nzMode]="field.multiple ? 'multiple' : 'default'" [nzAllowClear]="!field.notNull"
                                       [nzPlaceHolder]="field.notNull ? '' : ('scope.all' | translate)" [nzLoading]="field.loading"
                                       [(ngModel)]="f.values[field.name]" (ngModelChange)="changed(s, field)">
                                @for (o of field.options; track o.value) {
                                    <nz-option [nzValue]="o.value" [nzLabel]="o.label"></nz-option>
                                }
                            </nz-select>
                            }
                        }
                        @if (f.fields.length > 1 || !f.fields[0]?.choice) {
                            <div class="scope-form__actions">
                                <button nz-button nzSize="small" (click)="open[s.name] = false">{{ 'global.close' | translate }}</button>
                                <button nz-button nzType="primary" nzSize="small" [nzLoading]="saving" (click)="submit(s)">
                                    {{ 'scope.switch' | translate }}
                                </button>
                            </div>
                        }
                    </div>
                } @else {
                    <nz-spin nzSimple nzSize="small"></nz-spin>
                }
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
        .scope-form { width: 280px; display: flex; flex-direction: column; gap: 6px; }
        .scope-form__label { font-size: 12.5px; margin-top: 4px; }
        .scope-form__required { color: #ff4d4f; margin-right: 2px; }
        .scope-form__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
    `]
})
export class ScopeSwitchComponent implements OnInit, OnDestroy {

    open: { [scope: string]: boolean } = {};

    forms: { [scope: string]: ScopeForm } = {};

    saving = false;

    // the erupt model the current /build/table|tree|form/{name} page shows, lower-cased
    private currentErupt: string;

    private route$: Subscription;

    constructor(public scopeService: ScopeService,
                private router: Router,
                private dataService: DataService,
                private i18n: I18NService,
                @Inject(NzMessageService) private msg: NzMessageService) {
    }

    ngOnInit(): void {
        this.route$ = this.router.events.pipe(filter(e => e instanceof NavigationEnd))
            .subscribe((e: NavigationEnd) => this.follow(e.urlAfterRedirects));
        this.follow(this.router.url);
    }

    ngOnDestroy(): void {
        this.route$?.unsubscribe();
    }

    // scopes of the model on the current page; other pages have no use for them
    get shown(): ScopeView[] {
        return this.currentErupt
            ? this.scopeService.scopes.filter(s => (s.models || [s.parent]).some(m => m.toLowerCase() === this.currentErupt))
            : [];
    }

    private follow(url: string): void {
        const match = /\/build\/(?:table|tree|form)\/([^/?#;]+)/.exec(url || "");
        this.currentErupt = match ? decodeURIComponent(match[1]).toLowerCase() : null;
    }

    toggle(scope: ScopeView, visible: boolean): void {
        this.open[scope.name] = visible;
        if (visible && !this.forms[scope.name]) this.load(scope);
    }

    // The scope form's fields come from its erupt build, loaded under the parent model's menu
    private load(scope: ScopeView): void {
        this.dataService.getEruptBuild(scope.name, scope.parent).subscribe(build => {
            const fields: ScopeField[] = scope.fields.map(name => {
                const edit = build.eruptModel.eruptFieldModels.find(m => m.fieldName === name).eruptFieldJson.edit;
                const multiple = edit.type === EditType.MULTI_CHOICE;
                return {
                    name,
                    title: edit.title,
                    notNull: edit.notNull,
                    choice: multiple || edit.type === EditType.CHOICE,
                    multiple,
                    depend: (multiple ? edit.multiChoiceType?.dependField : edit.choiceType?.dependField) || null,
                    options: [],
                    loading: false
                };
            });
            const picked = this.scopeService.current(scope.name);
            const form: ScopeForm = {fields, values: {...(picked ? picked.values : {})}};
            this.forms[scope.name] = form;
            fields.filter(f => f.choice).forEach(f => this.options(scope, f));
        });
    }

    private options(scope: ScopeView, field: ScopeField): void {
        const form = this.forms[scope.name];
        field.loading = true;
        const options$ = field.depend
            ? this.dataService.findChoiceItemFilter(scope.name, field.name, form.values, scope.parent)
            : this.dataService.findChoiceItem(scope.name, field.name, scope.parent);
        options$.subscribe({
            next: (options: VL[]) => {
                field.options = options || [];
                field.loading = false;
            },
            error: () => field.loading = false
        });
    }

    changed(scope: ScopeView, field: ScopeField): void {
        const form = this.forms[scope.name];
        // A cascade: fields that depend on this one start over with its new value
        for (const dependent of form.fields.filter(f => f.depend === field.name)) {
            form.values[dependent.name] = null;
            this.options(scope, dependent);
        }
        if (form.fields.length === 1 && field.choice) this.submit(scope);
    }

    submit(scope: ScopeView): void {
        this.saving = true;
        this.scopeService.pick(scope.name, this.forms[scope.name].values).subscribe({
            next: () => {
                this.saving = false;
                this.open[scope.name] = false;
                this.msg.success(this.i18n.fanyi("scope.switched") + " " + this.scopeService.summary(scope.name));
            },
            error: () => this.saving = false
        });
    }

}
