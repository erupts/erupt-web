import {Component, EventEmitter, Inject, Input, OnInit, Output} from "@angular/core";
import {NzMessageService} from "ng-zorro-antd/message";
import {DataService} from "@shared/service/data.service";
import {ScopeService, ScopeView} from "@shared/service/scope.service";
import {colRules} from "@shared/model/util.model";
import {I18NService} from "@core";
import {DataHandlerService} from "../../service/data-handler.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {Scene} from "../../model/erupt.enum";

/**
 * The form of one scope: the scope's erupt form drawn by edit-type, loaded under the parent
 * model's menu. Shown on the scope page (ScopeGateComponent) and in the header popover, which the
 * layout mounts lazily through ScopeFormHostComponent so this module stays out of the main bundle.
 */
@Component({
    standalone: false,
    selector: "erupt-scope-form",
    template: `
        @if (build) {
            <div class="scope-form">
                <erupt-edit-type [eruptBuildModel]="build" [parentEruptName]="scope.parent" [mode]="Scene.ADD"
                                 size="default" [col]="col"></erupt-edit-type>
                <div class="scope-form__actions">
                    @if (closable) {
                        <button nz-button nzSize="small" (click)="closed.emit()">{{ 'global.close' | translate }}</button>
                    }
                    <button nz-button nzType="primary" nzSize="small" [nzLoading]="saving" (click)="submit()">
                        {{ 'scope.switch' | translate }}
                    </button>
                </div>
            </div>
        } @else {
            <nz-spin nzSimple nzSize="small"></nz-spin>
        }
    `,
    styles: [`
        .scope-form { width: 320px; }
        .scope-form__actions { display: flex; justify-content: flex-end; gap: 8px; }
    `]
})
export class ScopeFormComponent implements OnInit {

    @Input() scope: ScopeView;

    // shows a close button, for the header popover
    @Input() closable = false;

    // the page to open after the pick; by default the one it was picked on
    @Input() target: string;

    @Output() closed = new EventEmitter<void>();

    readonly Scene = Scene;

    readonly col = colRules[1];

    build: EruptBuildModel;

    saving = false;

    constructor(private scopeService: ScopeService,
                private dataService: DataService,
                private dataHandler: DataHandlerService,
                private i18n: I18NService,
                @Inject(NzMessageService) private msg: NzMessageService) {
    }

    ngOnInit(): void {
        this.dataService.getEruptBuild(this.scope.name, this.scope.parent).subscribe(build => {
            this.dataHandler.initErupt(build);
            const picked = this.scopeService.current(this.scope.name);
            if (picked) this.dataHandler.objectToEruptValue(picked.values, build);
            else this.dataHandler.emptyEruptValue(build);
            this.build = build;
        });
    }

    submit(): void {
        this.saving = true;
        this.scopeService.pick(this.scope.name, this.dataHandler.eruptValueToObject(this.build), this.target).subscribe({
            next: () => {
                this.saving = false;
                this.closed.emit();
                this.msg.success(this.i18n.fanyi("scope.switched") + " " + this.scopeService.summary(this.scope.name));
            },
            error: () => this.saving = false
        });
    }

}
