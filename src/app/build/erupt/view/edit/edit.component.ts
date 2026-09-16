import {Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, TemplateRef, ViewChild} from "@angular/core";
import {NzResizeEvent} from "ng-zorro-antd/resizable";
import {ModalButtonOptions} from "ng-zorro-antd/modal";
import {Scene} from "../../model/erupt.enum";
import {FormPanelMode} from "@shared/model/form-panel";
import type {FormNavigator, FormStep} from "../../service/form-modal.service";
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

    // ---- record workbench actions, all handled by FormModalService ----

    navigator?: FormNavigator;

    @Output() stepRecord = new EventEmitter<FormStep>();

    canToggleEdit = false;

    @Output() toggleEdit = new EventEmitter<void>();

    link?: string;

    @Output() copyLink = new EventEmitter<void>();

    // serialized form values right after loading; compared on close to detect unsaved input
    private snapshot?: string;

    // ---- modal footer (installed as nzFooter by FormModalService) ----
    // nz-modal's built-in footer snapshots its buttons once, so a recycled panel would keep
    // acting on the previous record; this template re-renders with the panel instead.

    @ViewChild("footerTpl", {static: true}) footerTpl: TemplateRef<{}>;

    // custom buttons; undefined renders the default Cancel / OK pair
    footerButtons?: ModalButtonOptions[];

    okText?: string;

    // nz-modal semantics: show / disabled / loading may be values or functions of the content
    buttonProp(button: ModalButtonOptions, key: "show" | "disabled" | "loading"): boolean {
        const value = button[key];
        return typeof value === "function" ? (value as Function).call(button, this) : value;
    }

    clickButton(button: ModalButtonOptions) {
        // nz-modal calls onClick as a method of the button object, with the content component
        if (button.onClick) button.onClick.call(button, this);
    }

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
        this.snapshot = undefined;
        this.dataHandlerService.emptyEruptValue(this.eruptBuildModel);
        if (this.behavior == Scene.ADD) {
            if (this.prefillData) {
                this.dataHandlerService.objectToEruptValue(this.prefillData, this.eruptBuildModel);
                this.takeSnapshot();
            } else {
                this.loading = true;
                this.dataService.getInitValue(this.eruptBuildModel.eruptModel.eruptName, null, this.header).subscribe(data => {
                    this.dataHandlerService.objectToEruptValue(data, this.eruptBuildModel);
                    this.loading = false;
                    this.takeSnapshot();
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
                    this.takeSnapshot();
                }, 50)
            });
        }
    }

    private serialize(): string | undefined {
        try {
            return JSON.stringify(this.dataHandlerService.eruptValueToObject(this.eruptBuildModel));
        } catch {
            return undefined;
        }
    }

    private takeSnapshot() {
        this.snapshot = this.serialize();
    }

    // Editable form whose values differ from what was loaded.
    isDirty(): boolean {
        if (this.readonly || this.snapshot === undefined) return false;
        return this.serialize() !== this.snapshot;
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
