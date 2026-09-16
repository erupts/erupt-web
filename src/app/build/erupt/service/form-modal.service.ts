import {Injectable} from "@angular/core";
import {ModalButtonOptions, ModalOptions, NzModalRef, NzModalService, NzModalState} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {SettingsService} from "@delon/theme";
import {I18NService} from "@core";
import {EditComponent} from "../view/edit/edit.component";
import {Scene} from "../model/erupt.enum";
import {EruptBuildModel} from "../model/erupt-build.model";
import {FORM_PANEL_MODE_KEY, FormPanelMode, formPanelModeOf} from "@shared/model/form-panel";

// localStorage key of the dragged side-panel width (one per form width class)
const SIDE_WIDTH_KEY = "erupt-form-panel:side-width";

const SIDE_MIN_WIDTH = 360;

export type FormStep = 1 | -1;

export interface FormParams {
    eruptBuildModel: EruptBuildModel;
    behavior: Scene;
    id?: any;
    readonly?: boolean;
    prefillData?: object;
    header?: object;
}

// Previous / next record browsing, implemented by the list that opened the panel.
export interface FormNavigator {
    // 1-based position of the record in the whole list, for the "n / total" readout
    position(): { index: number; total: number } | undefined;
    canStep(step: FormStep): boolean;
    // resolves the adjacent record, paging the list when needed; undefined at either end
    step(step: FormStep): Promise<any | undefined>;
    // reopens the panel on that record in the same role (view / edit)
    open(record: any, ref: NzModalRef<EditComponent>): void;
}

export interface FormModalOptions {
    title: string;
    params: FormParams;
    // single-column form (FormSize.FULL_LINE): narrower panel
    fullLine?: boolean;
    // opener identity; an open side view panel is only recycled for the same owner
    owner?: object;
    // load into this open panel instead of creating one (record browsing, view <-> edit)
    into?: NzModalRef<EditComponent>;
    navigator?: FormNavigator;
    // switches the panel between view and edit in place; absent when not permitted
    toggleEdit?: (ref: NzModalRef<EditComponent>) => void;
    // deep link to this record, offered as "copy link"
    link?: string;
    okText?: string;
    // custom footer; omit for the default OK / Cancel pair
    footer?: (ref: NzModalRef<EditComponent>) => ModalButtonOptions[];
    onOk?: (ref: NzModalRef<EditComponent>) => Promise<boolean> | boolean;
}

interface PanelEntry {
    opts: FormModalOptions;
}

/**
 * Opens the record form (EditComponent) in one nz-modal that can be re-skinned at runtime
 * into three forms (FormPanelMode): centered dialog, side panel, fullscreen. Switching only
 * updates the modal config, so the loaded form and any unsaved input survive.
 *
 * In side mode a read-only panel lets clicks through to the list behind it; the next
 * view / edit request from the same owner is loaded into that panel instead of stacking.
 * Closing, stepping to another record or leaving edit mode first asks to discard unsaved input.
 */
@Injectable()
export class FormModalService {

    private readonly panels = new Map<NzModalRef<EditComponent>, PanelEntry>();

    constructor(private modal: NzModalService,
                private msg: NzMessageService,
                private i18n: I18NService,
                private settingSrv: SettingsService) {
    }

    get mode(): FormPanelMode {
        return formPanelModeOf(this.settingSrv.layout);
    }

    open(opts: FormModalOptions): NzModalRef<EditComponent> {
        const target = opts.into ?? this.recyclable(opts.owner);
        if (target) {
            this.panels.get(target).opts = opts;
            this.apply(target, opts);
            target.getContentComponent().reload();
            return target;
        }
        const ref = this.modal.create<EditComponent>({nzContent: EditComponent});
        this.panels.set(ref, {opts});
        ref.afterClose.subscribe(() => this.panels.delete(ref));
        const comp = ref.getContentComponent();
        comp.panelModeChange.subscribe(mode => this.switchMode(ref, mode));
        comp.panelResize.subscribe(width => this.resizeSide(ref, width));
        comp.stepRecord.subscribe(step => this.step(ref, step));
        comp.toggleEdit.subscribe(() => this.toggleEdit(ref));
        comp.copyLink.subscribe(() => this.copyLink(ref));
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
        comp.navigator = opts.navigator;
        comp.canToggleEdit = !!opts.toggleEdit;
        comp.link = opts.link;
        comp.footerButtons = opts.footer?.(ref);
        comp.okText = opts.okText;
        // editable forms must be dismissed explicitly
        const locked = !comp.readonly;
        ref.updateConfig({
            nzTitle: comp.titleTpl,
            nzFooter: comp.footerTpl,
            nzMaskClosable: !locked,
            nzKeyboard: !locked,
            nzOnOk: opts.onOk ? () => opts.onOk(ref) : undefined,
            nzOnCancel: () => this.confirmDiscard(ref),
            ...this.modeConfig(this.mode, !!opts.fullLine, comp.readonly)
        });
    }

    private switchMode(ref: NzModalRef<EditComponent>, mode: FormPanelMode) {
        this.settingSrv.setLayout(FORM_PANEL_MODE_KEY, mode);
        const comp = ref.getContentComponent();
        comp.panelMode = mode;
        ref.updateConfig(this.modeConfig(mode, this.fullLine(ref), comp.readonly));
    }

    private async step(ref: NzModalRef<EditComponent>, step: FormStep) {
        const nav = this.panels.get(ref)?.opts.navigator;
        if (!nav?.canStep(step) || !await this.confirmDiscard(ref)) return;
        const record = await nav.step(step);
        if (record !== undefined) nav.open(record, ref);
    }

    private async toggleEdit(ref: NzModalRef<EditComponent>) {
        const toggle = this.panels.get(ref)?.opts.toggleEdit;
        if (toggle && await this.confirmDiscard(ref)) toggle(ref);
    }

    private copyLink(ref: NzModalRef<EditComponent>) {
        const link = this.panels.get(ref)?.opts.link;
        if (!link) return;
        navigator.clipboard.writeText(link)
            .then(() => this.msg.success(this.i18n.fanyi("global.copy_success")))
            // clipboard access refused (insecure context / unfocused document): show the link instead
            .catch(() => this.msg.info(link, {nzDuration: 8000}));
    }

    // True when the panel may be left: nothing changed, or the user chose to discard.
    private confirmDiscard(ref: NzModalRef<EditComponent>): Promise<boolean> {
        if (!ref.getContentComponent().isDirty()) return Promise.resolve(true);
        return new Promise(resolve => this.modal.confirm({
            nzTitle: this.i18n.fanyi("form.unsaved.confirm"),
            nzOkText: this.i18n.fanyi("form.unsaved.discard"),
            nzOkDanger: true,
            nzOnOk: () => resolve(true),
            nzOnCancel: () => resolve(false)
        }));
    }

    // Dragged side-panel width: applied live and remembered for the next panel.
    private resizeSide(ref: NzModalRef<EditComponent>, width: number) {
        if (width < SIDE_MIN_WIDTH) return;
        ref.updateConfig({nzWidth: width});
        try {
            localStorage.setItem(this.sideWidthKey(this.fullLine(ref)), String(width));
        } catch {
        }
    }

    private fullLine(ref: NzModalRef<EditComponent>): boolean {
        return !!this.panels.get(ref)?.opts.fullLine;
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
            if (entry.opts.owner === owner && ref.getState() === NzModalState.OPEN
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
