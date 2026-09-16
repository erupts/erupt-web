import {Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, TemplateRef, ViewChild} from "@angular/core";
import {NzResizeEvent} from "ng-zorro-antd/resizable";
import {Scene} from "../../model/erupt.enum";
import {FormPanelMode} from "@shared/model/form-panel";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataHandlerService} from "../../service/data-handler.service";
import {EditTypeComponent} from "../../components/edit-type/edit-type.component";
import {DataService} from "@shared/service/data.service";
import {I18NService} from "@core";
import {NzMessageService} from "ng-zorro-antd/message";

@Component({
    standalone: false,
    selector: "erupt-edit",
    templateUrl: "./edit.component.html",
    styleUrls: ["./edit.component.less"]
})
export class EditComponent implements OnInit {

    loading: boolean = false;

    @Input() behavior: Scene = Scene.ADD;

    @Output() save = new EventEmitter();

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() id: any;

    @Input() size: "large" | "small" | "default" = "large";

    @Input() readonly: boolean = false;

    @Input() header: object = {};

    @Input() prefillData?: object;

    @ViewChild("eruptEdit", {static: false}) eruptEditComponent: EditTypeComponent;

    // ---- modal title with the panel-mode switch (installed as nzTitle by FormModalService) ----

    @Input() title: string;

    panelMode: FormPanelMode = FormPanelMode.CENTER;

    @Output() panelModeChange = new EventEmitter<FormPanelMode>();

    @ViewChild("titleTpl", {static: true}) titleTpl: TemplateRef<{}>;

    readonly FormPanelMode = FormPanelMode;

    readonly panelModes: { mode: FormPanelMode; i18n: string }[] = [
        {mode: FormPanelMode.CENTER, i18n: "form.panel.center"},
        {mode: FormPanelMode.SIDE, i18n: "form.panel.side"},
        {mode: FormPanelMode.FULL, i18n: "global.fullscreen"}
    ];

    // new panel (modal) width requested by dragging the side panel's edge
    @Output() panelResize = new EventEmitter<number>();

    private resizeFrame = -1;

    constructor(
        @Inject(NzMessageService)
        private msg: NzMessageService,
        private dataService: DataService,
        private i18n: I18NService,
        private dataHandlerService: DataHandlerService,
        private elRef: ElementRef<HTMLElement>) {

    }

    onPanelResize({width}: NzResizeEvent) {
        cancelAnimationFrame(this.resizeFrame);
        this.resizeFrame = requestAnimationFrame(() => {
            const host = this.elRef.nativeElement;
            const modal = host.closest(".ant-modal");
            if (!modal) return;
            // the form fills the modal body, so a body delta is a panel delta
            const delta = width - host.getBoundingClientRect().width;
            this.panelResize.emit(Math.round(modal.getBoundingClientRect().width + delta));
        });
    }

    ngOnInit() {
        this.dataHandlerService.emptyEruptValue(this.eruptBuildModel);
        if (this.behavior == Scene.ADD) {
            if (this.prefillData) {
                this.dataHandlerService.objectToEruptValue(this.prefillData, this.eruptBuildModel);
            } else {
                this.loading = true;
                this.dataService.getInitValue(this.eruptBuildModel.eruptModel.eruptName, null, this.header).subscribe(data => {
                    this.dataHandlerService.objectToEruptValue(data, this.eruptBuildModel);
                    this.loading = false;
                }, () => {
                    this.loading = false;
                });
            }
        } else {
            this.loading = true;
            this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.id).subscribe(data => {
                this.dataHandlerService.objectToEruptValue(data, this.eruptBuildModel);
                // prevent @Onchange from being triggered during data loading in edit mode, which could inadvertently modify DB data (in ADD mode it must run due to data initialization requirements)
                setTimeout(() => {
                    this.loading = false;
                }, 50)
            });
        }
    }

    reload(): void {
        this.ngOnInit();
    }

    beforeSaveValidate(): boolean {
        if (this.loading) {
            this.msg.warning(this.i18n.fanyi('global.update.loading.hint'));
            return false;
        } else {
            return this.eruptEditComponent.eruptEditValidate();
        }
    }


}
