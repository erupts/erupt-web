import {Injectable} from "@angular/core";
import {ModalButtonOptions, ModalOptions, NzModalRef, NzModalService, NzModalState} from "ng-zorro-antd/modal";
import {SettingsService} from "@delon/theme";
import {EditComponent} from "../view/edit/edit.component";
import {Scene} from "../model/erupt.enum";
import {EruptBuildModel} from "../model/erupt-build.model";
import {FORM_PANEL_MODE_KEY, FormPanelMode, formPanelModeOf} from "@shared/model/form-panel";

// localStorage key of the dragged side-panel width (one per form width class)
const SIDE_WIDTH_KEY = "erupt-form-panel:side-width";

const SIDE_MIN_WIDTH = 360;

export interface FormParams {
    eruptBuildModel: EruptBuildModel;
    behavior: Scene;
    id?: any;
    readonly?: boolean;
    prefillData?: object;
    header?: object;
}

export interface FormModalOptions {
    title: string;
    params: FormParams;
    // single-column form (FormSize.FULL_LINE): narrower panel
    fullLine?: boolean;
    // opener identity; an open side view panel is only recycled for the same owner
    owner?: object;
    okText?: string;
    // custom footer; omit for the default OK / Cancel pair
    footer?: (ref: NzModalRef<EditComponent>) => ModalButtonOptions[];
    onOk?: (ref: NzModalRef<EditComponent>) => Promise<boolean> | boolean;
}

/**
 * Opens the record form (EditComponent) in one nz-modal that can be re-skinned at runtime
 * into three forms (FormPanelMode): centered dialog, side panel, fullscreen. Switching only
 * updates the modal config, so the loaded form and any unsaved input survive.
 *
 * In side mode a read-only panel lets clicks through to the list behind it; the next
 * view / edit request from the same owner is loaded into that panel instead of stacking.
 */
@Injectable()
export class FormModalService {

    private readonly panels = new Map<NzModalRef<EditComponent>, { owner?: object; fullLine: boolean }>();

    constructor(private modal: NzModalService,
                private settingSrv: SettingsService) {
    }

    get mode(): FormPanelMode {
        return formPanelModeOf(this.settingSrv.layout);
    }

    open(opts: FormModalOptions): NzModalRef<EditComponent> {
        const recycled = this.recyclable(opts.owner);
        if (recycled) {
            this.panels.get(recycled).fullLine = !!opts.fullLine;
            this.apply(recycled, opts);
            recycled.getContentComponent().reload();
            return recycled;
        }
        const ref = this.modal.create<EditComponent>({
            nzContent: EditComponent,
            nzFooter: opts.footer ? [] : undefined
        });
        this.panels.set(ref, {owner: opts.owner, fullLine: !!opts.fullLine});
        ref.afterClose.subscribe(() => this.panels.delete(ref));
        ref.getContentComponent().panelModeChange.subscribe(mode => this.switchMode(ref, mode));
        ref.getContentComponent().panelResize.subscribe(width => this.resizeSide(ref, width));
        this.apply(ref, opts);
        return ref;
    }

    // Everything that may change between two requests, applied to a fresh or recycled modal.
    private apply(ref: NzModalRef<EditComponent>, opts: FormModalOptions) {
        const comp = ref.getContentComponent();
        const p = opts.params;
        comp.eruptBuildModel = p.eruptBuildModel;
        comp.behavior = p.behavior;
        comp.id = p.id;
        comp.readonly = !!p.readonly;
        comp.prefillData = p.prefillData;
        comp.header = p.header || {};
        comp.title = opts.title;
        comp.panelMode = this.mode;
        // editable forms must be dismissed explicitly
        const locked = !comp.readonly;
        ref.updateConfig({
            nzTitle: comp.titleTpl,
            nzMaskClosable: !locked,
            nzKeyboard: !locked,
            nzOkText: opts.okText,
            nzFooter: opts.footer ? opts.footer(ref) : undefined,
            nzOnOk: opts.onOk ? () => opts.onOk(ref) : undefined,
            ...this.modeConfig(this.mode, !!opts.fullLine, comp.readonly)
        });
    }

    private switchMode(ref: NzModalRef<EditComponent>, mode: FormPanelMode) {
        this.settingSrv.setLayout(FORM_PANEL_MODE_KEY, mode);
        const comp = ref.getContentComponent();
        comp.panelMode = mode;
        ref.updateConfig(this.modeConfig(mode, this.panels.get(ref)?.fullLine, comp.readonly));
    }

    // Dragged side-panel width: applied live and remembered for the next panel.
    private resizeSide(ref: NzModalRef<EditComponent>, width: number) {
        if (width < SIDE_MIN_WIDTH) return;
        ref.updateConfig({nzWidth: width});
        try {
            localStorage.setItem(this.sideWidthKey(this.panels.get(ref)?.fullLine), String(width));
        } catch {
        }
    }

    private sideWidthKey(fullLine: boolean): string {
        return fullLine ? SIDE_WIDTH_KEY + ":full-line" : SIDE_WIDTH_KEY;
    }

    private savedSideWidth(fullLine: boolean): number | undefined {
        const saved = Number(localStorage.getItem(this.sideWidthKey(fullLine)));
        return saved >= SIDE_MIN_WIDTH ? saved : undefined;
    }

    // An open, read-only side panel of this owner that the next request can reuse.
    private recyclable(owner?: object): NzModalRef<EditComponent> | undefined {
        for (const [ref, entry] of this.panels) {
            const comp = ref.getContentComponent();
            if (entry.owner === owner && ref.getState() === NzModalState.OPEN
                && comp.panelMode === FormPanelMode.SIDE && comp.readonly) {
                return ref;
            }
        }
        return undefined;
    }

    // Modal config for one presentation. Layout lives in styles/form-panel.less under the
    // wrap class; only what nz-modal binds inline (width / style / mask) is set here.
    private modeConfig(mode: FormPanelMode, fullLine: boolean, readonly: boolean): Partial<ModalOptions> {
        const wrap = "erupt-form-panel erupt-form-panel--" + mode;
        switch (mode) {
            case FormPanelMode.FULL:
                return {
                    nzWrapClassName: wrap,
                    nzWidth: "100vw",
                    nzStyle: {top: 0, margin: 0, paddingBottom: 0, maxWidth: "100vw"},
                    nzDraggable: false,
                    nzMaskStyle: {}
                };
            case FormPanelMode.SIDE:
                return {
                    // view panels let the list behind stay clickable (see recyclable)
                    nzWrapClassName: wrap + (readonly ? " erupt-form-panel--passthrough" : ""),
                    nzWidth: this.savedSideWidth(fullLine) ?? (fullLine ? 560 : "min(75vw, 1080px)"),
                    nzStyle: {top: 0, margin: 0, marginInlineStart: "auto", paddingBottom: 0, maxWidth: "100vw"},
                    nzDraggable: false,
                    nzMaskStyle: readonly ? {pointerEvents: "none", background: "transparent"} : {}
                };
            default:
                return {
                    nzWrapClassName: wrap + (fullLine ? "" : " modal-lg edit-modal-lg"),
                    nzWidth: fullLine ? 550 : null,
                    nzStyle: {top: "60px"},
                    nzDraggable: true,
                    nzMaskStyle: {}
                };
        }
    }
}
