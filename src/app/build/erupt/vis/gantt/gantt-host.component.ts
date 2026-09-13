import {
    Component,
    ComponentRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import {NzSpinModule} from "ng-zorro-antd/spin";
import {SelectMode} from "../../model/erupt.enum";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Vis} from "../../model/erupt.model";

/**
 * Loads the gantt view on demand.
 *
 * @worktile/gantt is 126 KB and ships a single entry point, so any static reference
 * pulls all of it into whichever chunk holds the reference — for the table view that
 * meant every CRUD page paid for a view most of them never show. A @defer block cannot
 * help here: the table component is declared in an NgModule, and Angular only makes a
 * deferred dependency lazy when a standalone component imports it directly. So this
 * shell carries the same input/output surface and pulls the real view in itself.
 */
@Component({
    standalone: true,
    imports: [NzSpinModule],
    selector: 'vis-gantt',
    template: `
        @if (loading) {
            <nz-spin nzSimple style="display: block; padding: 48px 0; text-align: center"></nz-spin>
        }
        <ng-container #host></ng-container>
    `
})
export class GanttHostComponent implements OnInit, OnChanges, OnDestroy {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() data: any[] = [];

    @Input() vis: Vis;

    @Input() selectionMode: SelectMode | null = null;

    @Output() onEdit = new EventEmitter<any>();

    @Output() onUpdate = new EventEmitter<any>();

    @Output() onSelectionChange = new EventEmitter<any[]>();

    @ViewChild('host', {read: ViewContainerRef, static: true}) private host: ViewContainerRef;

    loading: boolean = true;

    private ref: ComponentRef<any>;

    private destroyed: boolean = false;

    private loadStarted: boolean = false;

    private static readonly INPUTS = ['eruptBuildModel', 'data', 'vis', 'selectionMode'];

    ngOnInit() {
        // ngOnChanges covers the normal case; this catches a host with no bound inputs.
        this.load();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!this.ref) {
            this.load();
            return;
        }
        // The view already exists: forward only what actually changed.
        for (const name of GanttHostComponent.INPUTS) {
            if (changes[name]) {
                this.ref.setInput(name, this[name]);
            }
        }
    }

    private load() {
        if (this.destroyed || this.loadStarted) {
            return;
        }
        this.loadStarted = true;
        import('./gantt.component').then(m => {
            if (this.destroyed) {
                return;
            }
            this.ref = this.host.createComponent(m.GanttComponent);
            for (const name of GanttHostComponent.INPUTS) {
                this.ref.setInput(name, this[name]);
            }
            const view = this.ref.instance;
            view.onEdit.subscribe((e: any) => this.onEdit.emit(e));
            view.onUpdate.subscribe((e: any) => this.onUpdate.emit(e));
            view.onSelectionChange.subscribe((e: any[]) => this.onSelectionChange.emit(e));
            this.loading = false;
            this.ref.changeDetectorRef.detectChanges();
        }).catch(error => {
            this.loading = false;
            console.error('Failed to load the gantt view:', error);
        });
    }

    ngOnDestroy() {
        this.destroyed = true;
        if (this.ref) {
            this.ref.destroy();
        }
    }

}
