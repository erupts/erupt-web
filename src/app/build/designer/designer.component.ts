import {Component, HostListener, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Location} from "@angular/common";
import {Subscription} from "rxjs";
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {I18NService} from "@core";
import {
    AttachmentEnum,
    ChoiceEnum,
    DateEnum,
    EditType,
    FormSize,
    PagingType,
    PickerMode,
    Scene
} from "../erupt/model/erupt.enum";
import {EruptBuildModel} from "../erupt/model/erupt-build.model";
import {DataHandlerService} from "../erupt/service/data-handler.service";
import {DesignerService} from "./service/designer.service";
import {DesignerField, DesignerForm, PALETTE_GROUPS, PaletteGroup, PaletteItem} from "./model/designer.model";

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
    readonly pickerMode = PickerMode;
    readonly choiceEnum = ChoiceEnum;
    readonly attachmentEnum = AttachmentEnum;
    readonly Scene = Scene;
    readonly formSize = FormSize;
    readonly pagingType = PagingType;

    form: DesignerForm = this.emptyForm();

    selected: DesignerField | null = null;

    // 表单（类级）配置抽屉
    formConfigVisible: boolean = false;

    // 实时预览（伪装注解 → 真实 erupt 渲染管线）
    previewVisible: boolean = false;
    previewLoading: boolean = false;
    previewBuild: EruptBuildModel | null = null;

    // 注解代码导出
    codeVisible: boolean = false;
    codeLoading: boolean = false;
    code: string | null = null;

    // 由"表单设计"列表行按钮进入时绑定的模型类名（后端持久化模式）
    boundClassName: string | null = null;

    publishing: boolean = false;

    // 有未发布的修改
    dirty: boolean = false;

    // 组件面板搜索
    paletteKeyword: string = "";

    // 已注册的 Erupt 模型名，引用类字段的关联模型选项
    eruptNames: string[] = [];

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
        this.designerService.erupts().subscribe(res => this.eruptNames = res.data || []);
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
        if (!this.boundClassName || !this.validate()) return;
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
            extendsModel: "BaseModel",
            erupt: {
                name: "",
                power: {add: true, edit: true, delete: true, query: true, viewDetails: true, export: false, importable: false, print: true},
                layout: {formSize: FormSize.DEFAULT, pagingType: PagingType.BACKEND, pageSize: 10, tableLeftFixed: 0, tableRightFixed: 0}
            },
            fields: []
        };
    }

    // 历史配置可能缺少后增的配置节点，补齐默认值避免模板绑定空指针
    private normalize(form: DesignerForm): DesignerForm {
        let empty = this.emptyForm();
        form.erupt.power = {...empty.erupt.power, ...form.erupt.power};
        form.erupt.layout = {...empty.erupt.layout, ...form.erupt.layout};
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
        if (this.selected === field) this.selected = null;
        this.saveDraft();
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
                    this.codeVisible = true;
                } else {
                    this.msg.error(res.message);
                }
            },
            error: () => this.codeLoading = false
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

    // 无法用真实控件 mock 的类型，展示占位块图标
    mockIcon(type: EditType): string {
        for (let group of this.paletteGroups) {
            for (let item of group.items) {
                if (item.type === type) return item.icon;
            }
        }
        return "appstore";
    }

    private validate(): boolean {
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
        for (let field of this.form.fields) {
            if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(field.fieldName)) {
                this.msg.warning(this.i18n.fanyi("designer.field_name_invalid") + ": " + field.fieldName);
                this.select(field);
                return false;
            }
        }
        return true;
    }

}
