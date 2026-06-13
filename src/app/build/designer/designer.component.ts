import {Component, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Location} from "@angular/common";
import {Subscription} from "rxjs";
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {I18NService} from "@core";
import {AttachmentEnum, ChoiceEnum, DateEnum, EditType, FormSize, PagingType, Scene} from "../erupt/model/erupt.enum";
import {EruptBuildModel} from "../erupt/model/erupt-build.model";
import {KV} from "../erupt/model/util.model";
import {DataHandlerService} from "../erupt/service/data-handler.service";
import {DesignerService} from "./service/designer.service";
import {
    CoverEffect,
    DesignerField,
    DesignerForm,
    DesignerVis,
    FieldVisibility,
    PALETTE_GROUPS,
    PaletteGroup,
    PaletteItem,
    VisType
} from "./model/designer.model";

const DRAFT_KEY = "erupt-designer-draft";

@Component({
    standalone: false,
    selector: "erupt-designer",
    templateUrl: "./designer.component.html",
    styleUrls: ["./designer.component.less"]
})
export class DesignerComponent implements OnInit, OnDestroy {

    readonly paletteGroups: PaletteGroup[] = PALETTE_GROUPS;
    readonly editType = EditType;
    readonly dateEnum = DateEnum;
    readonly choiceEnum = ChoiceEnum;
    readonly attachmentEnum = AttachmentEnum;
    readonly Scene = Scene;
    readonly formSize = FormSize;
    readonly visType = VisType;
    readonly fieldVisibility = FieldVisibility;
    readonly coverEffect = CoverEffect;

    form: DesignerForm = this.emptyForm();

    selected: DesignerField | null = null;

    // 字段名编辑前的原值，失焦时据此同步所有引用（模板绑定，不能为 private）
    renameFrom: string | null = null;

    // 表单（类级）配置抽屉
    formConfigVisible: boolean = false;

    // 多视图配置抽屉
    visConfigVisible: boolean = false;

    // 实时预览（伪装注解 → 真实 erupt 渲染管线）
    previewVisible: boolean = false;
    previewLoading: boolean = false;
    previewBuild: EruptBuildModel | null = null;

    // 注解代码导出（nz-code-editor / Monaco 只读展示，经 NzModalService 打开）
    codeLoading: boolean = false;
    code: string | null = null;
    readonly codeEditorOption = {language: "java", readOnly: true, minimap: {enabled: false}, automaticLayout: true, scrollBeyondLastLine: false};

    @ViewChild("codeModalTpl") codeModalTpl!: TemplateRef<unknown>;

    // 由"表单设计"列表行按钮进入时绑定的模型类名（后端持久化模式）
    boundClassName: string | null = null;

    publishing: boolean = false;

    // 有未发布的修改
    dirty: boolean = false;

    // 组件面板搜索
    paletteKeyword: string = "";

    // 已注册的 Erupt 模型，引用类字段的关联模型选项（key=类名，value=功能名称）
    eruptOptions: KV<string, string>[] = [];

    private keySeq: number = 0;

    private router$: Subscription;

    constructor(private route: ActivatedRoute,
                private location: Location,
                private designerService: DesignerService,
                private dataHandlerService: DataHandlerService,
                private i18n: I18NService,
                private msg: NzMessageService,
                private modal: NzModalService) {
    }

    ngOnInit(): void {
        this.designerService.erupts().subscribe(res => this.eruptOptions = res.data || []);
        this.router$ = this.route.params.subscribe(params => {
            this.boundClassName = params["className"] || null;
            this.selected = null;
            if (this.boundClassName) {
                this.designerService.getConfig(this.boundClassName).subscribe(res => {
                    if (res.data.config) {
                        this.form = this.normalize(JSON.parse(res.data.config));
                    } else {
                        this.form = this.emptyForm();
                        this.form.erupt.name = res.data.name;
                    }
                    this.form.className = res.data.className;
                    this.keySeq = this.form.fields.length;
                    this.dirty = false;
                });
            } else {
                let draft = localStorage.getItem(DRAFT_KEY);
                if (draft) {
                    try {
                        this.form = this.normalize(JSON.parse(draft));
                        this.keySeq = this.form.fields.length;
                    } catch (e) {
                        this.form = this.emptyForm();
                    }
                }
            }
        });
    }

    ngOnDestroy(): void {
        this.router$ && this.router$.unsubscribe();
    }

    // 发布：保存设计并注册运行时模型，免重启生效
    publish(): void {
        if (!this.boundClassName || !this.validate(true)) return;
        this.publishing = true;
        this.designerService.publish(this.boundClassName, this.form).subscribe({
            next: res => {
                this.publishing = false;
                if (res.success) {
                    this.dirty = false;
                    this.msg.success(this.i18n.fanyi("designer.publish_success") + ": " + this.boundClassName);
                } else {
                    this.msg.error(res.message);
                }
            },
            error: () => this.publishing = false
        });
    }

    emptyForm(): DesignerForm {
        return {
            pkg: "com.example.model",
            className: "",
            tableName: "",
            erupt: {
                name: "",
                power: {add: true, edit: true, delete: true, query: true, viewDetails: true, export: false, importable: false, print: true},
                layout: {formSize: FormSize.DEFAULT, pagingType: PagingType.BACKEND, pageSize: 10, tableLeftFixed: 0, tableRightFixed: 0},
                vis: []
            },
            fields: []
        };
    }

    // 历史配置可能缺少后增的配置节点，补齐默认值避免模板绑定空指针
    private normalize(form: DesignerForm): DesignerForm {
        let empty = this.emptyForm();
        form.erupt.power = {...empty.erupt.power, ...form.erupt.power};
        form.erupt.layout = {...empty.erupt.layout, ...form.erupt.layout};
        form.erupt.vis = (form.erupt.vis || []).map(v => {
            v.key = v.key || this.nextVisKey();
            this.initVisSub(v);
            return v;
        });
        return form;
    }

    // ---------------- 画布 ----------------

    drop(event: CdkDragDrop<DesignerField[] | PaletteItem[]>): void {
        if (event.previousContainer === event.container) {
            if (event.previousIndex === event.currentIndex) return;
            moveItemInArray(this.form.fields, event.previousIndex, event.currentIndex);
        } else {
            let item = <PaletteItem>event.previousContainer.data[event.previousIndex];
            let field = this.createField(item);
            this.form.fields.splice(event.currentIndex, 0, field);
            this.select(field);
        }
        this.saveDraft();
    }

    addFromPalette(item: PaletteItem): void {
        let field = this.createField(item);
        this.form.fields.push(field);
        this.select(field);
        this.saveDraft();
    }

    private createField(item: PaletteItem): DesignerField {
        let title = this.i18n.fanyi(item.label);
        let field: DesignerField = {
            key: "f" + (++this.keySeq) + "_" + Date.now(),
            fieldName: this.nextFieldName(),
            edit: {
                title: title,
                type: item.type,
                notNull: false,
                search: {value: false},
                ...(item.edit ? JSON.parse(JSON.stringify(item.edit)) : {})
            }
        };
        if (!item.noView) field.view = {title: title};
        if (item.needLink) field.linkErupt = "";
        return field;
    }

    private nextFieldName(): string {
        let i = this.form.fields.length + 1;
        while (this.form.fields.some(f => f.fieldName === "field" + i)) i++;
        return "field" + i;
    }

    select(field: DesignerField, event?: MouseEvent): void {
        event && event.stopPropagation();
        this.selected = field;
    }

    deselect(): void {
        this.selected = null;
    }

    back(): void {
        this.location.back();
    }

    // Delete 键删除选中字段（输入框聚焦时不生效）
    @HostListener("document:keydown.delete", ["$event"])
    onDeleteKey(event: Event): void {
        let tag = (<HTMLElement>event.target).tagName;
        if (this.selected && tag !== "INPUT" && tag !== "TEXTAREA") {
            this.removeField(this.selected, <MouseEvent>event);
        }
    }

    paletteItems(group: PaletteGroup): PaletteItem[] {
        if (!this.paletteKeyword) return group.items;
        let keyword = this.paletteKeyword.toLowerCase();
        return group.items.filter(it => this.i18n.fanyi(it.label).toLowerCase().includes(keyword)
            || it.type.toLowerCase().includes(keyword));
    }

    copyField(field: DesignerField, event: MouseEvent): void {
        event.stopPropagation();
        let copy: DesignerField = JSON.parse(JSON.stringify(field));
        copy.key = "f" + (++this.keySeq) + "_" + Date.now();
        copy.fieldName = this.nextFieldName();
        this.form.fields.splice(this.form.fields.indexOf(field) + 1, 0, copy);
        this.select(copy);
        this.saveDraft();
    }

    removeField(field: DesignerField, event: MouseEvent): void {
        event.stopPropagation();
        this.form.fields.splice(this.form.fields.indexOf(field), 1);
        this.remapFieldRefs(field.fieldName, null);   // 删除后清理所有引用
        if (this.selected === field) this.selected = null;
        this.saveDraft();
    }

    // 字段名失焦：将原名在分组/多视图/排序中的所有引用同步为新名
    commitRename(field: DesignerField): void {
        let old = this.renameFrom;
        this.renameFrom = null;
        if (old == null || old === field.fieldName) return;
        this.remapFieldRefs(old, field.fieldName);
        this.saveDraft();
    }

    // 字段名引用迁移：newName 为 null 表示删除引用，否则改写为新名
    private remapFieldRefs(oldName: string, newName: string | null): void {
        if (!oldName) return;
        let mapArr = (arr?: string[]) => !arr ? arr
            : newName === null ? arr.filter(n => n !== oldName) : arr.map(n => n === oldName ? newName : n);
        let mapVal = (v?: string) => v === oldName ? (newName ?? undefined) : v;
        // 分组字段
        for (let f of this.form.fields) {
            if (f.edit.groupType?.fields) f.edit.groupType.fields = mapArr(f.edit.groupType.fields);
        }
        // 默认排序
        if (this.orderByField === oldName) this.setOrderBy(newName ?? "", this.orderByDir);
        // 多视图各类字段引用
        for (let v of this.form.erupt.vis || []) {
            v.fields = mapArr(v.fields);
            if (v.boardView) v.boardView.groupField = mapVal(v.boardView.groupField);
            if (v.cardView) v.cardView.coverField = mapVal(v.cardView.coverField);
            if (v.ganttView) {
                v.ganttView.startDateField = mapVal(v.ganttView.startDateField);
                v.ganttView.endDateField = mapVal(v.ganttView.endDateField);
                v.ganttView.groupField = mapVal(v.ganttView.groupField);
                v.ganttView.pidField = mapVal(v.ganttView.pidField);
                v.ganttView.progressField = mapVal(v.ganttView.progressField);
                v.ganttView.colorField = mapVal(v.ganttView.colorField);
            }
            if (v.calendarView) {
                v.calendarView.dateField = mapVal(v.calendarView.dateField);
                v.calendarView.endDateField = mapVal(v.calendarView.endDateField);
                v.calendarView.colorField = mapVal(v.calendarView.colorField);
            }
        }
    }

    // 标题与列标题联动
    titleChange(field: DesignerField): void {
        if (field.view) field.view.title = field.edit.title;
        this.saveDraft();
    }

    saveDraft(): void {
        this.dirty = true;
        // 后端持久化模式下以「发布」为准，本地草稿仅用于演练模式
        if (!this.boundClassName) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(this.form));
        }
    }

    clear(): void {
        this.modal.confirm({
            nzTitle: this.i18n.fanyi("designer.clear_confirm"),
            nzOkText: this.i18n.fanyi("global.ok"),
            nzCancelText: this.i18n.fanyi("global.cancel"),
            nzOnOk: () => {
                this.form = this.emptyForm();
                this.selected = null;
                this.saveDraft();
            }
        });
    }

    // ---------------- 选项编辑 ----------------

    addVl(vl: { value: string; label: string }[]): void {
        vl.push({value: String(vl.length + 1), label: ""});
        this.saveDraft();
    }

    removeVl(vl: { value: string; label: string }[], index: number): void {
        vl.splice(index, 1);
        this.saveDraft();
    }

    // ---------------- 多视图（vis）----------------

    private nextVisKey(): string {
        return "vis" + (++this.keySeq) + "_" + Date.now();
    }

    // 可供视图选择的字段：表单中的全部字段（按字段名）
    visFieldOptions(): { name: string; label: string }[] {
        return this.form.fields
            .filter(f => f.edit.type !== this.editType.DIVIDE && f.edit.type !== this.editType.GROUP)
            .map(f => ({name: f.fieldName, label: f.edit.title + " (" + f.fieldName + ")"}));
    }

    // 默认排序：从 orderBy 表达式（如 "createTime desc"）派生字段与方向，避免让用户手写表达式
    get orderByField(): string {
        return (this.form.erupt.orderBy || "").trim().split(/\s+/)[0] || "";
    }

    set orderByField(field: string) {
        this.setOrderBy(field, this.orderByDir);
    }

    get orderByDir(): "asc" | "desc" {
        return (this.form.erupt.orderBy || "").trim().split(/\s+/)[1]?.toLowerCase() === "desc" ? "desc" : "asc";
    }

    set orderByDir(dir: "asc" | "desc") {
        this.setOrderBy(this.orderByField, dir);
    }

    private setOrderBy(field: string, dir: "asc" | "desc"): void {
        this.form.erupt.orderBy = field ? field + " " + dir : "";
        this.saveDraft();
    }

    addVis(): void {
        let vis: DesignerVis = {
            key: this.nextVisKey(),
            title: this.i18n.fanyi("designer.vis.default_title"),
            type: VisType.TABLE,
            fieldVisibility: FieldVisibility.EXCLUDE,
            fields: []
        };
        this.form.erupt.vis = this.form.erupt.vis || [];
        this.form.erupt.vis.push(vis);
        this.saveDraft();
    }

    removeVis(index: number): void {
        this.form.erupt.vis!.splice(index, 1);
        this.saveDraft();
    }

    // 视图类型对应的图标
    visIcon(type: VisType | undefined): string {
        switch (type) {
            case VisType.CARD:
                return "appstore";
            case VisType.BOARD:
                return "project";
            case VisType.GANTT:
                return "bar-chart";
            case VisType.CALENDAR:
                return "calendar";
            default:
                return "table";
        }
    }

    // 切换视图类型时，按需初始化该类型专属的子配置对象
    visTypeChange(vis: DesignerVis): void {
        this.initVisSub(vis);
        this.saveDraft();
    }

    // 确保该视图类型专属的子配置对象存在，避免模板 !. 绑定空指针
    private initVisSub(vis: DesignerVis): void {
        switch (vis.type) {
            case VisType.BOARD:
                vis.boardView = vis.boardView || {};
                break;
            case VisType.CARD:
                vis.cardView = vis.cardView || {coverEffect: CoverEffect.CLIP};
                break;
            case VisType.GANTT:
                vis.ganttView = vis.ganttView || {};
                break;
            case VisType.CALENDAR:
                vis.calendarView = vis.calendarView || {};
                break;
        }
    }

    // ---------------- 预览 / 代码 ----------------

    preview(): void {
        if (!this.validate()) return;
        this.previewLoading = true;
        this.designerService.preview(this.form).subscribe({
            next: build => {
                this.dataHandlerService.initErupt(build);
                this.dataHandlerService.emptyEruptValue(build);
                this.previewBuild = build;
                this.previewLoading = false;
                this.previewVisible = true;
            },
            error: () => this.previewLoading = false
        });
    }

    generateCode(): void {
        if (!this.validate()) return;
        this.codeLoading = true;
        this.designerService.javaCode(this.form).subscribe({
            next: res => {
                this.codeLoading = false;
                if (res.success) {
                    this.code = res.data;
                    this.openCodeModal();
                } else {
                    this.msg.error(res.message);
                }
            },
            error: () => this.codeLoading = false
        });
    }

    // 以服务方式打开代码弹窗（Monaco 只读 + 复制/关闭）
    private openCodeModal(): void {
        let ref = this.modal.create({
            nzTitle: (this.form.className || "Model") + ".java",
            nzContent: this.codeModalTpl,
            nzWidth: 860,
            nzStyle: {top: "30px"},
            nzBodyStyle: {padding: "0"},
            nzFooter: [
                {label: this.i18n.fanyi("global.copy"), onClick: () => this.copyCode()},
                {label: this.i18n.fanyi("global.close"), type: "primary", onClick: () => ref.destroy()}
            ]
        });
    }

    copyCode(): void {
        if (this.code) {
            navigator.clipboard.writeText(this.code).then(() => this.msg.success(this.i18n.fanyi("designer.copy_success")));
        }
    }

    // 与 edit-type 渲染规则对齐：这些类型始终整行展示
    private static readonly FULL_LINE_TYPES = new Set<EditType>([
        EditType.DIVIDE, EditType.GROUP, EditType.COMBINE, EditType.TEXTAREA, EditType.MARKDOWN,
        EditType.TAGS, EditType.CHECKBOX, EditType.ATTACHMENT, EditType.HTML_EDITOR, EditType.MAP,
        EditType.CODE_EDITOR, EditType.SIGNATURE, EditType.TAB_TABLE_ADD, EditType.TAB_TABLE_REFER, EditType.TAB_TREE
    ]);

    // 画布字段是否整行：表单尺寸为 FULL_LINE、类型天然整行、或 INPUT 配置了 fullSpan
    fullLine(field: DesignerField): boolean {
        if (this.form.erupt.layout?.formSize === FormSize.FULL_LINE) return true;
        if (field.edit.inputType?.fullSpan) return true;
        return DesignerComponent.FULL_LINE_TYPES.has(field.edit.type);
    }

    // 仅引用类组件需要"关联模型"配置
    private static readonly LINK_TYPES = new Set<EditType>([
        EditType.REFERENCE_TABLE, EditType.REFERENCE_TREE, EditType.CHECKBOX,
        EditType.TAB_TABLE_ADD, EditType.TAB_TABLE_REFER, EditType.TAB_TREE, EditType.COMBINE
    ]);

    needLink(type: EditType): boolean {
        return DesignerComponent.LINK_TYPES.has(type);
    }

    // 无法用真实控件 mock 的类型，展示占位块图标
    mockIcon(type: EditType): string {
        for (let group of this.paletteGroups) {
            for (let item of group.items) {
                if (item.type === type) return item.icon;
            }
        }
        return "appstore";
    }

    // checkVis：仅发布时校验多视图完整性（生成代码/预览无需被未配全的视图卡住）
    private validate(checkVis: boolean = false): boolean {
        if (this.form.fields.length === 0) {
            this.msg.warning(this.i18n.fanyi("designer.empty_canvas"));
            return false;
        }
        if (!this.form.className) {
            this.form.className = "DesignModel";
        }
        if (!this.form.erupt.name) {
            this.form.erupt.name = this.form.className;
        }
        let seen = new Set<string>();
        for (let field of this.form.fields) {
            if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(field.fieldName)) {
                this.msg.warning(this.i18n.fanyi("designer.field_name_invalid") + ": " + field.fieldName);
                this.select(field);
                return false;
            }
            if (seen.has(field.fieldName)) {
                this.msg.warning(this.i18n.fanyi("designer.field_name_duplicate") + ": " + field.fieldName);
                this.select(field);
                return false;
            }
            seen.add(field.fieldName);
            if (this.needLink(field.edit.type) && !field.linkErupt) {
                this.msg.warning(this.i18n.fanyi("designer.link_erupt_required") + ": " + field.edit.title);
                this.select(field);
                return false;
            }
        }
        if (checkVis) {
            for (let vis of this.form.erupt.vis || []) {
                if (!this.validateVis(vis)) return false;
            }
        }
        return true;
    }

    // 多视图基本校验：缺少关键字段时给出提示并打开多视图抽屉
    private validateVis(vis: DesignerVis): boolean {
        let fail = (key: string) => {
            this.msg.warning(this.i18n.fanyi(key) + (vis.title ? ": " + vis.title : ""));
            this.visConfigVisible = true;
            return false;
        };
        if (!vis.title) return fail("designer.vis.title_required");
        if (vis.type === VisType.GANTT && (!vis.ganttView?.startDateField || !vis.ganttView?.endDateField)) {
            return fail("designer.vis.gantt_date_required");
        }
        if (vis.type === VisType.BOARD && !vis.boardView?.groupField) {
            return fail("designer.vis.board_group_required");
        }
        if (vis.type === VisType.CALENDAR && !vis.calendarView?.dateField) {
            return fail("designer.vis.calendar_date_required");
        }
        return true;
    }

}
