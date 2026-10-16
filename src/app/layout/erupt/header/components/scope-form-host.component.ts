import {
    Component,
    ComponentRef,
    createNgModule,
    EnvironmentInjector,
    EventEmitter,
    Input,
    NgModuleRef,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ViewContainerRef
} from "@angular/core";
import {Subscription} from "rxjs";
import {ScopeView} from "@shared/service/scope.service";
import type {ScopeFormComponent} from "../../../../build/erupt/components/scope-form/scope-form.component";

/**
 * Mounts the scope form, which lives in the lazy erupt module next to edit-type. Scopes only show
 * on erupt pages, so that chunk is loaded by then anyway; one module instance serves every form.
 */
@Component({
    standalone: false,
    selector: "scope-form-host",
    template: `<ng-container #host></ng-container>`
})
export class ScopeFormHostComponent implements OnInit, OnDestroy {

    private static module: Promise<{ moduleRef: NgModuleRef<unknown>, form: typeof ScopeFormComponent }>;

    @Input() scope: ScopeView;

    @Input() closable = false;

    @Output() closed = new EventEmitter<void>();

    @ViewChild("host", {read: ViewContainerRef, static: true}) host: ViewContainerRef;

    private ref: ComponentRef<ScopeFormComponent>;

    private closed$: Subscription;

    private destroyed = false;

    // the environment injector, not this host's: the module outlives the host that first loads it
    constructor(private injector: EnvironmentInjector) {
    }

    async ngOnInit(): Promise<void> {
        ScopeFormHostComponent.module ??= Promise.all([
            import("../../../../build/erupt/erupt.module"),
            import("../../../../build/erupt/components/scope-form/scope-form.component")
        ]).then(([m, c]) => ({moduleRef: createNgModule(m.EruptModule, this.injector), form: c.ScopeFormComponent}));
        const {moduleRef, form} = await ScopeFormHostComponent.module;
        if (this.destroyed) return;
        this.ref = this.host.createComponent(form, {ngModuleRef: moduleRef});
        this.ref.setInput("scope", this.scope);
        this.ref.setInput("closable", this.closable);
        this.closed$ = this.ref.instance.closed.subscribe(() => this.closed.emit());
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        this.closed$?.unsubscribe();
        this.ref?.destroy();
    }

}
