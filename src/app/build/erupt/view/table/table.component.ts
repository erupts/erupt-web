import {Component, ElementRef, Inject, Input, OnDestroy, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {Router} from "@angular/router";
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";
import {DataService} from "@shared/service/data.service";
import {
    Alert,
    Drill,
    DrillInput,
    EruptModel,
    Page,
    Power,
    Row,
    RowOperation,
    Vis,
    VisType
} from "../../model/erupt.model";

import {MenuService, SettingsService} from "@delon/theme";
import {EditTypeComponent} from "../../components/edit-type/edit-type.component";
import {EditComponent} from "../edit/edit.component";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {cloneDeep} from "lodash";
import {
    FormSize,
    OperationIfExprBehavior,
    OperationMode,
    OperationType,
    PagingType,
    RestPath,
    Scene,
    SelectMode,
    SortType,
    TableSize,
    ViewType
} from "../../model/erupt.enum";
import {DataHandlerService} from "../../service/data-handler.service";
import {ExcelImportComponent} from "../../components/excel-import/excel-import.component";
import {Status} from "../../model/erupt-api.model";
import {EruptFieldModel, View} from "../../model/erupt-field.model";
import {Observable} from "rxjs";
import {UiBuildService} from "../../service/ui-build.service";
import {EruptColumnConfig, LocalSettingsService} from "../../service/local-settings.service";
import {I18NService} from "@core";
import {NzMessageService} from "ng-zorro-antd/message";
import {ModalButtonOptions, NzModalRef, NzModalService} from "ng-zorro-antd/modal";
import {STChange, STColumn, STColumnButton, STComponent, STPage} from "@delon/abc/st";
import {AppViewService} from "@shared/service/app-view.service";
import {CodeEditorComponent} from "../../components/code-editor/code-editor.component";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {TableStyle} from "../../model/erupt.vo";
import {EruptIframeComponent} from "@shared/component/iframe.component";
import {WindowModel} from "@shared/model/window.model";
import {PrintTypeComponent} from "../../components/print-type/print-type";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {PrintTemplate, PrintVar} from "@shared/component/print-template/print-template";
import printJS from 'print-js';


@Component({
    standalone: false,
    selector: "erupt-table",
    templateUrl: "./table.component.html",
    styleUrls: ["./table.component.less"]
})
export class TableComponent implements OnInit, OnDestroy {

    protected readonly VisType = VisType;

    constructor(
        public settingSrv: SettingsService,
        @Inject(NzMessageService)
        private msg: NzMessageService,
        @Inject(NzModalService)
        private modal: NzModalService,
        private appViewService: AppViewService,
        public dataService: DataService,
        private dataHandler: DataHandlerService,
        private uiBuildService: UiBuildService,
        public i18n: I18NService,
        @Inject(NzDrawerService)
        private drawerService: NzDrawerService,
        private eruptLocalSettings: LocalSettingsService,
        private el: ElementRef,
        private menuSrv: MenuService,
        private router: Router
    ) {
        this.hideCondition = !!this.settingSrv.layout['searchCollapsed'];
    }

    @ViewChild("st", {static: false})
    st: STComponent;

    @ViewChild("printSelectTpl", {static: true})
    printSelectTpl: TemplateRef<any>;

    @ViewChild("printConfigListTpl", {static: true})
    printConfigListTpl: TemplateRef<any>;

    printSelectData: any[] = [];

    printConfigListData: any[] = [];

    private printConfigListRef: NzModalRef;

    extraRows: Row[];

    extraContent: string;

    operationMode = OperationMode;

    showColCtrl: boolean = false;

    deleting: boolean = false;

    clientWidth: number = document.body.clientWidth;

    clientHeight: number = document.body.clientHeight;

    get tableScrollY(): string {
        if (this.clientWidth > 768) {
            return (this.clientHeight > 814 ? 525 + (this.clientHeight - 814) : 525) + 'px';
        }
        return Math.max(200, this.clientHeight - 290) + 'px';
    }

    hideCondition: boolean = false;

    alert: Alert;

    searchErupt: EruptModel;

    hasSearchFields: boolean = false;

    eruptBuildModel: EruptBuildModel;

    selectedRows: any[] = [];

    columns: STColumn[];

    linkTree: boolean = false;

    showTable: boolean = true;

    downloading: boolean = false;

    _drill: DrillInput;

    dataPage: {
        querying: boolean,
        showPagination: boolean
        pageSizes: number[],
        ps: number;
        pi: number;
        sort: Record<string, SortType>;
        total: number;
        data: any[];
        page: STPage;
        url: string
    } = {
        querying: false,
        showPagination: true,
        pageSizes: [10, 20, 50, 100, 300, 500],
        ps: 10,
        pi: 1,
        total: 0,
        data: [],
        sort: null,
        page: {
            show: false,
            toTop: false
        },
        url: null
    };

    vis: Vis[];

    selectedVisIndex: number = 0;

    visOptions: any[] = [];

    adding: boolean = false; //debounce for add action

    header: object;

    refreshTimeInterval: any;

    autoRefreshSeconds: number = 0;

    existMultiRowFoldButtons: boolean = false;

    tableWidth: string;

    showSortPopover: boolean = false;

    searchFieldsCollapsed: boolean = true;

    isFullscreen: boolean = false;

    treeWidth: number = 235;

    treeCollapsed: boolean = false;

    resizing: boolean = false;

    showAiPanel: boolean = false;

    aiPanelWidth: number = 420;

    aiContext: string = '';

    aiResizing: boolean = false;

    private _aiResizeCleanup: (() => void) | null = null;

    private fullscreenChange = () => {
        this.isFullscreen = !!document.fullscreenElement;
    };

    private _resizeCleanup: (() => void) | null = null;

    sortFields: View[] = [];

    selectedSorts: { field: View, direction: SortType }[] = [];

    tempSelectedField: View = null;

    @Input() set drill(drill: DrillInput) {
        this._drill = drill;
        this.init(this.dataService.getEruptBuild(drill.erupt), {
            url: RestPath.data + "/table/" + drill.erupt,
            header: {
                erupt: drill.erupt,
                ...DataService.drillToHeader(drill)
            }
        });
    }

    _reference: { eruptBuild: EruptBuildModel, eruptField: EruptFieldModel, mode: SelectMode };

    @Input() set referenceTable(reference: {
        eruptBuild: EruptBuildModel,
        eruptField: EruptFieldModel, mode: SelectMode,
        parentEruptName?: string,
        dependVal?: any, tabRef: boolean
    }) {
        this._reference = reference;
        this.init(this.dataService.getEruptBuildByField(reference.eruptBuild.eruptModel.eruptName,
            reference.eruptField.fieldName, reference.parentEruptName), {
            url: RestPath.data + "/" + reference.eruptBuild.eruptModel.eruptName
                + "/reference-table/" + reference.eruptField.fieldName
                + "?tabRef=" + reference.tabRef
                + (reference.dependVal ? "&dependValue=" + reference.dependVal : ''),
            header: {
                erupt: reference.eruptBuild.eruptModel.eruptName,
                eruptParent: reference.parentEruptName || ''
            }
        }, (eb: EruptBuildModel) => {
            let erupt = eb.eruptModel.eruptJson;
            erupt.rowOperation = [];
            erupt.drills = [];
            erupt.power.add = false;
            erupt.power.delete = false;
            erupt.power.importable = false;
            erupt.power.edit = false;
            erupt.power.export = false;
            erupt.power.viewDetails = false;
        });
    }


    @Input() set eruptName(value: string) {
        this.init(this.dataService.getEruptBuild(value), {
            url: RestPath.data + "/table/" + value,
            header: {
                erupt: value
            }
        }, (eb: EruptBuildModel) => {
            this.appViewService.setRouterViewDesc(eb.eruptModel.eruptJson.desc);
        });
    }

    ngOnInit() {
        document.addEventListener('fullscreenchange', this.fullscreenChange);
    }

    get isEruptPrint(): boolean {
        return EruptAppData.get().properties["erupt-print"];
    }

    get hasPrintConfig(): boolean {
        return this.isEruptPrint && null != this.menuSrv.getItem("PRINT_CONFIG");
    }

    ngOnDestroy(): void {
        this.refreshTimeInterval && clearInterval(this.refreshTimeInterval);
        document.removeEventListener('fullscreenchange', this.fullscreenChange);
        this._resizeCleanup?.();
        this._aiResizeCleanup?.();
    }

    onResizeDragStart(e: MouseEvent): void {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = this.treeWidth;
        this.resizing = true;

        const onMove = (ev: MouseEvent) => {
            const next = Math.max(120, Math.min(600, startWidth + ev.clientX - startX));
            this.treeWidth = next;
        };
        const onUp = () => {
            this.resizing = false;
            this.eruptLocalSettings.patch(this.eruptBuildModel.eruptModel.eruptName, {treeWidth: this.treeWidth});
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        this._resizeCleanup = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }

    toggleTreeCollapsed() {
        this.treeCollapsed = !this.treeCollapsed;
        this.eruptLocalSettings.patch(this.eruptBuildModel.eruptModel.eruptName, {treeCollapsed: this.treeCollapsed});
    }

    get isAiEnabled(): boolean {
        return EruptAppData.get().properties["erupt-ai"] && null != this.menuSrv.getItem("ai-chat");
    }

    toggleAiPanel() {
        this.showAiPanel = !this.showAiPanel;
        this.eruptLocalSettings.patch(this.eruptBuildModel.eruptModel.eruptName, {aiPanelOpen: this.showAiPanel});
    }

    onAiResizeDragStart(e: MouseEvent): void {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = this.aiPanelWidth;
        this.aiResizing = true;
        const onMove = (ev: MouseEvent) => {
            this.aiPanelWidth = Math.max(280, Math.min(800, startWidth + startX - ev.clientX));
        };
        const onUp = () => {
            this.aiResizing = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            this.eruptLocalSettings.patch(this.eruptBuildModel.eruptModel.eruptName, {aiPanelWidth: this.aiPanelWidth});
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        this._aiResizeCleanup = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.el.nativeElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }


    init(observable: Observable<EruptBuildModel>, req: {
        url: string,
        header: any
    }, callback?: Function) {
        this.selectedRows = [];
        this.showTable = true;
        this.adding = false;
        this.eruptBuildModel = null;
        this.searchErupt = null;
        this.hasSearchFields = false;
        this.existMultiRowFoldButtons = false;
        this.sortFields = [];
        this.selectedSorts = [];
        this.tempSelectedField = null;
        this.showSortPopover = false;
        this.header = req.header;
        this.dataPage.url = req.url;
        observable.subscribe(eb => {
                this.vis = eb.eruptModel.eruptJson.vis || [];
                if (this.vis.length) {
                    this.hideCondition = true;
                    this.visOptions = this.vis.map((i, index) => ({
                        label: i.title,
                        value: index,
                        useTemplate: true
                    }))
                    if (eb.eruptModel.eruptJson.visRawTable) {
                        this.visOptions.push({
                            icon: 'table'
                        })
                    }
                }
                eb.eruptModel.eruptJson.rowOperation.forEach((item) => {
                    if (item.mode != OperationMode.SINGLE) {
                        if (item.fold) {
                            this.existMultiRowFoldButtons = true;
                        }
                    }
                })

                for (let eruptFieldModel of eb.eruptModel.eruptFieldModels) {
                    for (let view of eruptFieldModel.eruptFieldJson.views) {
                        if (view.sortable) {
                            this.sortFields.push(view);
                        }
                    }
                }

                let layout = eb.eruptModel.eruptJson.layout;
                if (layout) {
                    if (layout.pageSizes) {
                        this.dataPage.pageSizes = layout.pageSizes;
                    }
                    if (layout.pageSize) {
                        this.dataPage.ps = layout.pageSize;
                    }
                    if (layout.pagingType) {
                        if (layout.pagingType == PagingType.FRONT) {
                            let page = this.dataPage.page;
                            page.front = true;
                            page.show = true;
                            page.placement = "center";
                            page.showQuickJumper = true;
                            page.showSize = true;
                            page.pageSizes = layout.pageSizes;
                            this.dataPage.showPagination = false;
                        } else if (layout.pagingType == PagingType.NONE) {
                            this.dataPage.ps = layout.pageSizes[layout.pageSizes.length - 1] * 10;
                            this.dataPage.showPagination = false;
                            this.dataPage.page.show = false;
                        }
                    }
                    if (layout.refreshTime && layout.refreshTime > 0) {
                        this.refreshTimeInterval = setInterval(() => {
                            try {
                                this.query();
                            } catch (e) {
                                this.query(1)
                            }
                        }, layout.refreshTime);
                    }
                }
                let dt = eb.eruptModel.eruptJson.linkTree;
                this.linkTree = !!dt;
                const savedSettings = this.eruptLocalSettings.get(eb.eruptModel.eruptName);
                if (this.linkTree && savedSettings.treeWidth) this.treeWidth = savedSettings.treeWidth;
                if (this.linkTree && savedSettings.treeCollapsed !== undefined) this.treeCollapsed = savedSettings.treeCollapsed;
                if (savedSettings.aiPanelOpen) this.showAiPanel = true;
                if (savedSettings.aiPanelWidth) this.aiPanelWidth = savedSettings.aiPanelWidth;
                this.dataHandler.initErupt(eb);
                callback && callback(eb);
                this.eruptBuildModel = eb;
                const _menuPath = this.menuSrv.getPathByUrl(this.router.url.split('?')[0]);
                const _menuName = _menuPath.length ? _menuPath[_menuPath.length - 1].text : null;
                const _m = eb.eruptModel;
                const _displayName = _menuName || _m.eruptName;
                const _lines: string[] = [
                    `The user is currently viewing the data management module "${_displayName}".`,
                    `Technical model name: ${_m.eruptName}.`
                ];
                if (_m.eruptJson.desc) _lines.push(`Module description: ${_m.eruptJson.desc}`);
                _lines.push(`Always refer to this module as "${_displayName}" in your responses, never use the technical model name directly.`);
                this.aiContext = _lines.join('\n');
                this.buildTableConfig();
                this.searchErupt = <EruptModel>cloneDeep(this.eruptBuildModel.eruptModel);
                for (let fieldModel of this.searchErupt.eruptFieldModels) {
                    let edit = fieldModel.eruptFieldJson.edit;
                    if (edit) {
                        if (edit.search.value) {
                            this.hasSearchFields = true;
                            fieldModel.eruptFieldJson.edit.$value = this.searchErupt.searchCondition[fieldModel.fieldName]
                        }
                    }
                }
                this.dataHandler.initSearchOperators(this.searchErupt);
                if (!this.vis.length) {
                    this.hideCondition = savedSettings.searchCollapsed !== undefined
                        ? savedSettings.searchCollapsed
                        : !!this.settingSrv.layout['searchCollapsed'];
                }
                if (savedSettings.searchOperators) {
                    for (const field of this.searchErupt.eruptFieldModels) {
                        const edit = field.eruptFieldJson.edit;
                        if (!edit?.search?.value) continue;
                        const op = savedSettings.searchOperators[field.fieldName];
                        if (op !== undefined) edit.$operator = op as any;
                    }
                }
                if (savedSettings.pageSize && this.dataPage.showPagination) {
                    this.dataPage.ps = savedSettings.pageSize;
                }
                if (savedSettings.visIndex !== undefined && savedSettings.visIndex < this.vis.length) {
                    this.selectedVisIndex = savedSettings.visIndex;
                }
                this.searchFieldsCollapsed = savedSettings.searchFieldsCollapsed ?? true;
                if (dt) {
                    this.showTable = !dt.dependNode;
                    if (dt.dependNode) {
                        return;
                    }
                }
                this.query(1);
            }
        );
    }

    visChange(e: number) {
        this.eruptLocalSettings.patch(this.eruptBuildModel.eruptModel.eruptName, {visIndex: e});
        const vis = this.vis[e];
        if (vis?.type === VisType.BOARD) {
            const savedPs = this.dataPage.ps;
            this.query(1, 1000);
            this.dataPage.ps = savedPs;
        } else {
            this.query(1);
        }
    }

    toggleCondition() {
        this.hideCondition = !this.hideCondition;
        this.eruptLocalSettings.patch(this.eruptBuildModel.eruptModel.eruptName, {searchCollapsed: this.hideCondition});
    }

    private buildQueryBody(): Page {
        const body: any = {
            condition: this.dataHandler.buildSearchConditions(this.searchErupt),
            pageIndex: this.dataPage.pi,
            pageSize: this.dataPage.ps,
            vis: this.vis[this.selectedVisIndex]?.code,
            sort: null
        };
        const linkTree = this.eruptBuildModel.eruptModel.eruptJson.linkTree;
        if (linkTree && linkTree.field) {
            body.linkTreeVal = linkTree.value;
        }
        if (this.dataPage.sort) {
            body.sort = Object.entries(this.dataPage.sort).map(([field, dir]) => ({
                field,
                direction: (dir as string).toUpperCase() as SortType
            }));
        }
        return body;
    }

    query(page?: number, size?: number, sort?: Record<string, SortType>) {
        if (!this.eruptBuildModel.power.query) {
            return;
        }
        this.dataPage.pi = page || this.dataPage.pi;
        this.dataPage.ps = size || this.dataPage.ps;
        this.dataPage.sort = sort || this.dataPage.sort;
        this.selectedRows = [];
        this.dataPage.querying = true;
        this.setVisTplData(null)
        this.dataService.queryEruptTableData(this.eruptBuildModel.eruptModel.eruptName, this.dataPage.url,
            this.buildQueryBody(), this.header).subscribe(page => {
            this.dataPage.querying = false;
            this.dataPage.data = page.list || [];
            this.dataPage.total = page.total;
            this.alert = page.alert;
            this.extraContent = page.extraContent;
            if (this.selectedVisIndex) {
                if (this.vis[this.selectedVisIndex].type == VisType.TPL) {
                    this.setVisTplData(this.dataPage.data);
                }
            }
        })
        this.extraRowFun(this.buildQueryBody());
    }

    setVisTplData(data: any[]) {
        window[WindowModel.VIS_TPL_DATA_KEY] = data;
    }

    getVisTplData(): any[] {
        return window[WindowModel.VIS_TPL_DATA_KEY];
    }

    buildTableConfig() {
        const _columns: STColumn[] = [];
        if (this._reference) {
            _columns.push({
                title: "",
                type: this._reference.mode,
                fixed: "left",
                resizable: false,
                width: "50px",
                className: {"text-center": true},
                index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
            });
        } else {
            _columns.push({
                title: "",
                width: "50px",
                resizable: false,
                type: "checkbox",
                fixed: "left",
                className: {"text-center": true},
                index: this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol
            });
        }
        let viewCols = this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true);
        for (let viewCol of viewCols) {
            viewCol.iif = () => {
                return viewCol['show'];
            };
        }
        _columns.push(...viewCols);
        const tableOperators: STColumnButton[] = [];
        const collapseAction = this.eruptBuildModel.eruptModel.eruptJson.layout?.collapseActionButton;
        const collapsedStd: STColumnButton[] = [];
        if (this.eruptBuildModel.eruptModel.eruptJson.power.viewDetails) {
            let fullLine = false;
            let layout = this.eruptBuildModel.eruptModel.eruptJson.layout;
            if (layout && layout.formSize == FormSize.FULL_LINE) {
                fullLine = true;
            }
            const _viewClick = (record: any, modal: any) => {
                let params = {
                    readonly: true,
                    eruptBuildModel: this.eruptBuildModel,
                    behavior: Scene.EDIT,
                    id: record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]
                };
                if (this.settingSrv.layout['drawDraw']) {
                    //open details in drawer mode
                    this.drawerService.create({
                        nzTitle: this.i18n.fanyi("global.view"),
                        nzWidth: "75%",
                        nzContent: EditComponent,
                        nzContentParams: params
                    });
                } else {
                    let ref = this.modal.create({
                        nzDraggable: true,
                        nzWrapClassName: fullLine ? null : "modal-lg edit-modal-lg",
                        nzWidth: fullLine ? 550 : null,
                        nzStyle: {top: "60px"},
                        nzMaskClosable: true,
                        nzKeyboard: true,
                        nzTitle: this.i18n.fanyi("global.view"),
                        nzContent: EditComponent,
                        nzFooter: [
                            ...getEditButtons(record),
                            {
                                label: this.i18n.fanyi("global.refresh"),
                                icon: "reload",
                                onClick: () => ref.getContentComponent().reload()
                            },
                            {
                                label: this.i18n.fanyi("global.close"),
                                icon: "close",
                                onClick: () => ref.close()
                            }
                        ]
                    });
                    Object.assign(ref.getContentComponent(), params)
                }
            };
            const _viewIif = (item) => {
                if (item[TableStyle.power]) {
                    return (<Power>item[TableStyle.power]).viewDetails !== false
                }
                return true;
            };
            if (collapseAction) {
                collapsedStd.push({ text: this.i18n.fanyi("global.view"), click: _viewClick, iif: _viewIif });
            } else {
                tableOperators.push({ icon: "eye", tooltip: this.i18n.fanyi("global.view"), click: _viewClick, iif: _viewIif });
            }
        }
        let tableButtons: STColumnButton[] = []
        let editButtons: ModalButtonOptions[] = [];
        const that = this;
        let exprEval = (expr, item) => {
            try {
                if (expr) {
                    return new Function("item", "return " + expr)(item);
                } else {
                    return true;
                }
            } catch (e) {
                // this.msg.error(e);
                return false;
            }
        }
        let isFoldButtons = false;
        for (let i in this.eruptBuildModel.eruptModel.eruptJson.rowOperation) {
            let ro = this.eruptBuildModel.eruptModel.eruptJson.rowOperation[i];
            if (ro.mode !== OperationMode.BUTTON && ro.mode !== OperationMode.MULTI_ONLY) {
                if (ro.fold) {
                    isFoldButtons = true;
                } else {
                    let text = "";
                    if (ro.icon) {
                        text = `<i class=\"${ro.icon}\"></i>`;
                    } else {
                        text = ro.title;
                    }
                    tableButtons.push({
                        type: 'link',
                        text: text,
                        tooltip: ro.title + (ro.tip && "(" + ro.tip + ")"),
                        click: (record: any, modal: any) => {
                            that.createOperator(ro, record);
                        },
                        iifBehavior: ro.ifExprBehavior == OperationIfExprBehavior.DISABLE ? "disabled" : "hide",
                        iif: (item) => {
                            return exprEval(ro.ifExpr, item);
                        }
                    });
                }
            }
        }

        //drill
        const eruptJson = this.eruptBuildModel.eruptModel.eruptJson;

        let createDrillModel = (drill: Drill, id: any) => {
            let ref = this.modal.create({
                nzDraggable: true,
                nzWrapClassName: "modal-xxl",
                nzStyle: {top: "30px"},
                nzBodyStyle: {padding: "0"},
                nzMaskClosable: false,
                nzKeyboard: false,
                nzTitle: drill.title,
                nzFooter: null,
                nzContent: TableComponent
            });
            ref.getContentComponent().drill = {
                code: drill.code,
                val: id,
                erupt: drill.link.linkErupt,
                eruptParent: this.eruptBuildModel.eruptModel.eruptName
            }
        }

        for (let i in eruptJson.drills) {
            let drill = eruptJson.drills[i];
            if (drill.fold) {
                isFoldButtons = true;
            } else {
                tableButtons.push({
                    type: 'link',
                    tooltip: drill.title,
                    text: `<i class="${drill.icon}"></i>`,
                    click: (record) => {
                        createDrillModel(drill, record[eruptJson.primaryKeyCol]);
                    }
                });
            }
            editButtons.push({
                label: drill.title,
                type: 'dashed',
                onClick(options: ModalButtonOptions<any>) {
                    createDrillModel(drill, options[eruptJson.primaryKeyCol]);
                }
            })
        }

        let getEditButtons = (record: any): ModalButtonOptions[] => {
            for (let editButton of editButtons) {
                editButton['id'] = record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]
                editButton['data'] = record
            }
            const roButtons: ModalButtonOptions[] = this.eruptBuildModel.eruptModel.eruptJson.rowOperation
                .filter(ro => ro.mode !== OperationMode.BUTTON && ro.mode !== OperationMode.MULTI_ONLY)
                .map(ro => {
                    const enabled = exprEval(ro.ifExpr, record);
                    return {
                        label: ro.title,
                        type: 'dashed' as const,
                        show: enabled || ro.ifExprBehavior === OperationIfExprBehavior.DISABLE,
                        disabled: !enabled && ro.ifExprBehavior === OperationIfExprBehavior.DISABLE,
                        onClick: (comp: any) => that.createOperator(ro, {[eruptJson.primaryKeyCol]: comp.id})
                    };
                });
            return [...roButtons, ...editButtons];
        }

        if (this.eruptBuildModel.eruptModel.eruptJson.power.edit) {
            let fullLine = false;
            let layout = this.eruptBuildModel.eruptModel.eruptJson.layout;
            if (layout && layout.formSize == FormSize.FULL_LINE) {
                fullLine = true;
            }
            const _editClick = (record: any) => {
                this.onEdit(record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol], fullLine, getEditButtons(record));
            };
            const _editIif = (item) => {
                if (item[TableStyle.power]) {
                    return (<Power>item[TableStyle.power]).edit !== false
                }
                return true;
            };
            if (collapseAction) {
                collapsedStd.push({ text: this.i18n.fanyi("global.editor"), click: _editClick, iif: _editIif });
            } else {
                tableOperators.push({ icon: "edit", tooltip: this.i18n.fanyi("global.editor"), click: _editClick, iif: _editIif });
            }
        }
        if (this.eruptBuildModel.eruptModel.eruptJson.power.delete) {
            const _delClick = (record) => {
                this.dataService.deleteEruptData(this.eruptBuildModel.eruptModel.eruptName,
                    record[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol])
                    .subscribe(result => {
                        if (result.status === Status.SUCCESS) {
                            if (this.dataPage.data.length <= 1) {
                                this.query(this.dataPage.pi == 1 ? 1 : this.dataPage.pi - 1);
                            } else {
                                this.query(this.dataPage.pi);
                            }
                            this.msg.success(this.i18n.fanyi('global.delete.success'));
                        }
                    });
            };
            const _delIif = (item) => {
                if (item[TableStyle.power]) {
                    return (<Power>item[TableStyle.power]).delete !== false
                }
                return true;
            };
            if (collapseAction) {
                collapsedStd.push({ text: this.i18n.fanyi("global.delete"), pop: this.i18n.fanyi("table.delete.hint"), type: "del", click: _delClick, iif: _delIif });
            } else {
                tableOperators.push({
                    icon: { type: "delete", theme: "twotone", twoToneColor: "#f00" },
                    tooltip: this.i18n.fanyi("global.delete"),
                    pop: this.i18n.fanyi("table.delete.hint"),
                    type: "del",
                    click: _delClick,
                    iif: _delIif
                });
            }
        }
        tableOperators.push(...tableButtons);
        if (this.eruptBuildModel.eruptModel.tags?.["EruptFlow"]) {
            tableOperators.push({
                icon: "node-index",
                tooltip: this.i18n.fanyi("VIEW_FLOW"),
                click: (record: any, modal: any) => {
                    this.drawerService.create({
                        nzClosable: false,
                        nzKeyboard: true,
                        nzMaskClosable: true,
                        // @ts-ignore
                        nzPlacement: "right",
                        nzWidth: "60%",
                        nzBodyStyle: {
                            padding: 0
                        },
                        nzFooter: null,
                        nzContent: EruptIframeComponent,
                        nzContentParams: {
                            url: location.origin + "/#/fill/flow/approval-detail/" + record["__flow_id__"],
                            height: "100%",
                            width: '100%'
                        }
                    })
                },
                iif: (item) => {
                    return item["__flow_id__"];
                }
            });
        }
        if (collapsedStd.length > 0) isFoldButtons = true;
        if (isFoldButtons) {
            let children: STColumnButton[] = [...collapsedStd];
            eruptJson.rowOperation.forEach(ro => {
                if (ro.mode !== OperationMode.BUTTON && ro.mode !== OperationMode.MULTI_ONLY) {
                    ro.fold && children.push({
                        text: (ro.icon && `<i class=\"${ro.icon}\"></i> &nbsp;`) + ro.title,
                        iifBehavior: 'disabled',
                        tooltip: ro.tip,
                        iif: (item) => exprEval(ro.ifExpr, item),
                        click: (record) => that.createOperator(ro, record)
                    })
                }
            });
            eruptJson.drills.forEach(drill => {
                drill.fold && children.push({
                    text: (drill.icon && `<i class=\"${drill.icon}\"></i> &nbsp;`) + drill.title,
                    iifBehavior: 'disabled',
                    // tooltip: drill.title,
                    click: (record) => createDrillModel(drill, record[eruptJson.primaryKeyCol])
                })
            });
            tableOperators.push({
                text: this.i18n.fanyi("global.more") + " ",
                children: children
            });
        }
        if (tableOperators.length > 0) {
            _columns.push({
                title: this.i18n.fanyi("table.operation"),
                fixed: "right",
                width: eruptJson.layout.tableOperatorWidth ? eruptJson.layout.tableOperatorWidth :
                    ((tableOperators.length + (this.eruptBuildModel.eruptModel.tags?.size || 0)) * 35 + 18 + (isFoldButtons ? 60 : 0)),
                className: "text-center",
                buttons: tableOperators,
                resizable: false
            });
        }
        this.restoreColumnSettings(this.eruptBuildModel.eruptModel.eruptName, _columns);
        this.columns = _columns;
        if (eruptJson.layout.tableWidth) {
            this.tableWidth = eruptJson.layout.tableWidth;
        } else {
            this.tableWidth = (this.eruptBuildModel.eruptModel.tableColumns.filter(e => e.show).length * 160 * this.i18n.getCurrLangInfo().columnWidthZoom) + "px"
        }
    }

    onEdit(pk: any, fullLine = false, buttons: ModalButtonOptions[] = []) {
        let params = {
            eruptBuildModel: this.eruptBuildModel,
            id: pk,
            behavior: Scene.EDIT
        }
        const doSave = async (): Promise<boolean> => {
            let validateResult = model.getContentComponent().beforeSaveValidate();
            if (!validateResult) return false;
            let obj = this.dataHandler.eruptValueToObject(this.eruptBuildModel);
            let res = await this.dataService.updateEruptData(this.eruptBuildModel.eruptModel.eruptName, obj).toPromise();
            if (res.status === Status.SUCCESS) {
                this.msg.success(this.i18n.fanyi("global.update.success"));
                this.query();
                return true;
            }
            return false;
        };
        const model = this.modal.create({
            nzDraggable: true,
            nzWrapClassName: fullLine ? null : "modal-lg edit-modal-lg",
            nzWidth: fullLine ? 550 : null,
            nzStyle: {top: "60px"},
            nzMaskClosable: false,
            nzKeyboard: false,
            nzTitle: this.i18n.fanyi("global.editor"),
            nzContent: EditComponent,
            nzFooter: [
                {
                    label: this.i18n.fanyi("global.cancel"),
                    onClick: () => model.close()
                },
                {
                    label: this.i18n.fanyi("global.refresh"),
                    icon: "reload",
                    onClick: () => model.getContentComponent().reload()
                },
                ...buttons,
                {
                    label: this.i18n.fanyi("global.save_only"),
                    icon: "save",
                    onClick: async () => { await doSave(); }
                },
                {
                    label: this.i18n.fanyi("global.save_close"),
                    type: "primary",
                    icon: "check",
                    onClick: () => model.triggerOk()
                },
            ],
            nzOnOk: async () => doSave()
        });
        Object.assign(model.getContentComponent(), params)
    }


    /**
     * Trigger a custom row operation
     * @param rowOperation row operation button object
     * @param data data (used when executing a single row action)
     */
    createOperator(rowOperation: RowOperation, data?: object) {
        const eruptModel = this.eruptBuildModel.eruptModel;
        const ro = rowOperation;
        let ids = [];
        if (data) {
            ids = [data[eruptModel.eruptJson.primaryKeyCol]];
        } else {
            if ((ro.mode === OperationMode.MULTI || ro.mode === OperationMode.MULTI_ONLY) && this.selectedRows.length === 0) {
                this.msg.warning(this.i18n.fanyi("table.require.select_one"));
                return;
            }
            this.selectedRows.forEach(e => {
                ids.push(e[eruptModel.eruptJson.primaryKeyCol]);
            });
        }
        if (ro.type === OperationType.TPL) {
            let url = this.dataService.getEruptOperationTpl(this.eruptBuildModel.eruptModel.eruptName, ro.code, ids);
            this.uiBuildService.openTpl(data, ro.title, url, ro.tpl)
        } else if (ro.type === OperationType.ERUPT) {
            let operationErupt: EruptModel = null;
            if (this.eruptBuildModel.operationErupts) {
                operationErupt = this.eruptBuildModel.operationErupts[ro.code];
            }
            if (operationErupt) {
                this.dataHandler.initErupt({eruptModel: operationErupt});
                this.dataHandler.emptyEruptValue({
                    eruptModel: operationErupt
                });
                let modal: NzModalRef = this.modal.create({
                    nzDraggable: true,
                    nzKeyboard: false,
                    nzTitle: ro.title,
                    nzMaskClosable: false,
                    nzCancelText: this.i18n.fanyi("global.close"),
                    nzWrapClassName: "modal-lg",
                    nzOnOk: async () => {
                        modal.componentInstance.nzCancelDisabled = true;
                        let eruptValue = this.dataHandler.eruptValueToObject({eruptModel: operationErupt});
                        let res = await this.dataService.execOperatorFun(eruptModel.eruptName, ro.code, ids, eruptValue).toPromise().then(res => res);
                        modal.componentInstance.nzCancelDisabled = false;
                        this.selectedRows = [];
                        if (res.status === Status.SUCCESS) {
                            this.query();
                            if (res.data) {
                                this.execExpr(res.data);
                            }
                            return true;
                        } else {
                            return false;
                        }
                    },
                    nzContent: EditTypeComponent
                });
                modal.getContentComponent().mode = Scene.ADD;
                modal.getContentComponent().eruptBuildModel = {eruptModel: operationErupt};
                modal.getContentComponent().parentEruptName = this.eruptBuildModel.eruptModel.eruptName;
                this.dataService.operatorFormValue(this.eruptBuildModel.eruptModel.eruptName, ro.code, ids).subscribe(data => {
                    if (data) {
                        this.dataHandler.objectToEruptValue(data, {
                            eruptModel: operationErupt
                        });
                    }
                });
            } else {
                // backward compatibility for older versions without callHint configuration
                if (null == ro.callHint) {
                    ro.callHint = this.i18n.fanyi("table.hint.operation");
                }
                if (ro.callHint) {
                    this.modal.confirm({
                        nzTitle: ro.title,
                        nzContent: ro.callHint,
                        nzCancelText: this.i18n.fanyi("global.close"),
                        nzOnOk: async () => {
                            this.selectedRows = [];
                            let res = await this.dataService.execOperatorFun(this.eruptBuildModel.eruptModel.eruptName, ro.code, ids, null)
                                .toPromise().then();
                            this.query();
                            if (res.data) {
                                this.execExpr(res.data);
                            }
                        }
                    });
                } else {
                    this.selectedRows = [];
                    let msgLoading = this.msg.loading(ro.title);
                    this.dataService.execOperatorFun(this.eruptBuildModel.eruptModel.eruptName, ro.code, ids, null).subscribe(res => {
                        this.msg.remove(msgLoading.messageId);
                        if (res.data) {
                            this.execExpr(res.data);
                        }
                    });

                }
            }
        }
    }

    //add new record
    addData() {
        let fullLine = false;
        let layout = this.eruptBuildModel.eruptModel.eruptJson.layout;
        if (layout && layout.formSize == FormSize.FULL_LINE) {
            fullLine = true;
        }
        const modal = this.modal.create({
            nzDraggable: true,
            nzStyle: {top: "60px"},
            nzWrapClassName: fullLine ? null : "modal-lg edit-modal-lg",
            nzWidth: fullLine ? 550 : null,
            nzMaskClosable: false,
            nzKeyboard: false,
            nzTitle: this.i18n.fanyi("global.new"),
            nzContent: EditComponent,
            nzOkText: this.i18n.fanyi("global.add"),
            nzOnOk: async () => {
                if (!this.adding) {
                    this.adding = true;
                    setTimeout(() => {
                        this.adding = false;
                    }, 500);
                    if (modal.getContentComponent().beforeSaveValidate()) {
                        let header = {};
                        if (this.linkTree) {
                            let lt = this.eruptBuildModel.eruptModel.eruptJson.linkTree;
                            if (lt.dependNode && lt.value) {
                                header["link"] = this.eruptBuildModel.eruptModel.eruptJson.linkTree.value;
                            }
                        }
                        if (this._drill) {
                            Object.assign(header, DataService.drillToHeader(this._drill));
                        }
                        await this.dataService.addEruptData(this.eruptBuildModel.eruptModel.eruptName,
                            this.dataHandler.eruptValueToObject(this.eruptBuildModel), header).toPromise().then(res => res);
                        this.msg.success(this.i18n.fanyi("global.add.success"));
                        this.query();
                        return true;
                    }
                }
                return false;
            }
        });
        modal.getContentComponent().eruptBuildModel = this.eruptBuildModel
        modal.getContentComponent().header = this._drill ? DataService.drillToHeader(this._drill) : {};
    }

    pageIndexChange(index) {
        this.query(index, this.dataPage.ps);
    }

    pageSizeChange(size) {
        this.eruptLocalSettings.patch(this.eruptBuildModel.eruptModel.eruptName, {pageSize: size});
        this.query(1, size);
    }

    onSearchFieldsCollapsedChange(collapsed: boolean) {
        this.searchFieldsCollapsed = collapsed;
        this.eruptLocalSettings.patch(this.eruptBuildModel.eruptModel.eruptName, {searchFieldsCollapsed: collapsed});
    }

    saveSearchOperators() {
        if (!this.searchErupt || !this.eruptBuildModel) return;
        const ops: Record<string, string> = {};
        for (const field of this.searchErupt.eruptFieldModels) {
            const edit = field.eruptFieldJson.edit;
            if (!edit?.search?.value || edit.$operator == null) continue;
            ops[field.fieldName] = edit.$operator;
        }
        this.eruptLocalSettings.patch(this.eruptBuildModel.eruptModel.eruptName, {searchOperators: ops});
    }

    //batch delete
    delRows() {
        if (!this.selectedRows || this.selectedRows.length === 0) {
            this.msg.warning(this.i18n.fanyi("table.select_delete_item"));
            return;
        }
        const ids = [];
        this.selectedRows.forEach(e => {
            ids.push(e[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol]);
        });
        if (ids.length > 0) {
            this.modal.confirm(
                {
                    nzTitle: this.i18n.fanyi("table.hint_delete_number").replace("{}", ids.length + ""),
                    nzContent: "",
                    nzOnOk: async () => {
                        this.deleting = true;
                        try {
                            let res = await this.dataService.deleteEruptDataList(this.eruptBuildModel.eruptModel.eruptName, ids).toPromise().then(res => res);
                            this.deleting = false;
                            if (res.status == Status.SUCCESS) {
                                if (this.selectedRows.length == this.dataPage.data.length) {
                                    this.query(this.dataPage.pi == 1 ? 1 : this.dataPage.pi - 1);
                                } else {
                                    this.query(this.dataPage.pi);
                                }
                                this.selectedRows = [];
                                this.msg.success(this.i18n.fanyi("global.delete.success"));
                            }
                        } catch (e) {
                            this.deleting = false;
                        }
                    }
                }
            );
        } else {
            this.msg.error(this.i18n.fanyi("table.select_delete_item"));
        }
    }

    clearCondition() {
        this.dataHandler.emptyEruptValue({eruptModel: this.searchErupt});
        this.dataHandler.resetSearchOperators(this.searchErupt);
        this.selectedSorts = [];
        this.query(1);
    }

    // table checkbox change event
    tableDataChange(event: STChange) {
        if (this._reference) {
            if (this._reference.mode == SelectMode.radio) {
                if (event.type === "click") {
                    this.st.clearRadio();
                    this.st.setRow(event.click.index, {checked: true})
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = event.click.item;
                } else if (event.type === "radio") {
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = event.radio;
                }
            } else if (this._reference.mode == SelectMode.checkbox) {
                // this.st.setRow(event.click.index, {checked: !event.click.item.checked})
                if (event.type === "checkbox") {
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = event.checkbox;
                }
            }
        } else {
            if (event.type === "checkbox") {
                this.selectedRows = event.checkbox;
            }
        }
        if (event.type == "sort") {
            let layout = this.eruptBuildModel.eruptModel.eruptJson.layout
            if (layout && layout.pagingType && layout.pagingType != PagingType.BACKEND) {
                return;
            }
            this.query(1, this.dataPage.ps, (event.sort.map as Record<string, SortType>));
        }
        if (event.type === "resize" && event.resize?.index) {
            const eruptName = this.eruptBuildModel.eruptModel.eruptName;
            const saved = this.eruptLocalSettings.getColumns(eruptName);
            const key = event.resize.index as string;
            saved[key] = {...(saved[key] || {}), width: event.resize.width};
            this.eruptLocalSettings.setColumns(eruptName, saved);
        }
    }

    // handle Gantt chart selection change
    handleGanttSelectionChange(selectedRows: any[]) {
        this.selectedRows = selectedRows;

        // if in reference table mode, store the selected data into $tempValue
        if (this._reference) {
            if (selectedRows && selectedRows.length > 0) {
                // check whether it is single-select or multi-select mode
                if (this._reference.mode === SelectMode.radio) {
                    // single-select mode: take the first item
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = selectedRows[0];
                } else {
                    // multi-select mode: save the entire array
                    this._reference.eruptField.eruptFieldJson.edit.$tempValue = selectedRows;
                }
            } else {
                this._reference.eruptField.eruptFieldJson.edit.$tempValue = null;
            }
        }
    }

    downloadExcelTemplate() {
        this.dataService.downloadExcelTemplate(this.eruptBuildModel.eruptModel.eruptName);
    }

    // export to Excel
    exportExcel() {
        const ids = this.selectedRows.length > 0
            ? this.selectedRows.map(r => r[this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol])
            : null;
        this.downloading = true;
        this.dataService.downloadExcel(this.eruptBuildModel.eruptModel.eruptName, this.buildQueryBody(),
            this._drill ? DataService.drillToHeader(this._drill) : {},
            () => { this.downloading = false; },
            ids
        );
    }


    clickTreeNode(event: string[]) {
        this.showTable = true;
        this.eruptBuildModel.eruptModel.eruptJson.linkTree.value = event;
        this.searchErupt.eruptJson.linkTree.value = event;
        this.query(1);
    }

    extraRowFun(condition: any) {
        this.extraRows = null;
        if (this.eruptBuildModel.eruptModel.extraRow) {
            this.dataService.extraRow(this.eruptBuildModel.eruptModel.eruptName, condition).subscribe(res => {
                this.extraRows = res;
            });
        }
    }

    // import from Excel
    importableExcel() {
        let model = this.modal.create({
            nzDraggable: true,
            nzKeyboard: true,
            nzTitle: "Excel " + this.i18n.fanyi("table.import"),
            nzOkText: null,
            nzCancelText: this.i18n.fanyi("global.close") + "（ESC）",
            nzWrapClassName: "modal-lg",
            nzContent: ExcelImportComponent,
            nzOnCancel: () => {
                if (model.getContentComponent().upload) {
                    this.query();
                }
            }
        });
        model.getContentComponent().eruptModel = this.eruptBuildModel.eruptModel;
        model.getContentComponent().drillInput = this._drill;
    }

    //provides callable functions for custom expressions
    execExpr(expr: string) {
        let ev = {
            codeModal: (lang: string, code: any) => {
                let ref = this.modal.create({
                    nzDraggable: true,
                    nzKeyboard: true,
                    nzMaskClosable: true,
                    nzCancelText: this.i18n.fanyi("global.close"),
                    nzWrapClassName: "modal-lg",
                    nzContent: CodeEditorComponent,
                    nzFooter: null,
                    nzBodyStyle: {padding: '0'}
                });
                ref.getContentComponent().height = 500;
                ref.getContentComponent().readonly = true;
                ref.getContentComponent().language = lang;
                // @ts-ignore
                ref.getContentComponent().edit = {$value: code}
            }
        }
        try {
            new Function(...Object.keys(ev), expr)(...Object.values(ev));
        } catch (e) {
            this.msg.error(e);
        }
    }


    get hasActiveConditions(): boolean {
        if (!this.searchErupt) return false;
        return this.searchErupt.eruptFieldModels.some(f => {
            const v = f.eruptFieldJson.edit?.$value;
            return v !== null && v !== undefined && v !== '';
        });
    }

    private colIndexStr(col: STColumn): string {
        return (Array.isArray(col.index) ? col.index[0] : col.index) as string;
    }

    saveColumnSettings() {
        const eruptName = this.eruptBuildModel.eruptModel.eruptName;
        const columns: Record<string, EruptColumnConfig> = {};
        const columnOrder: string[] = [];
        this.columns.forEach(col => {
            if (!col.index) return;
            const idx = this.colIndexStr(col);
            columns[idx] = {show: col['show'], width: col.width, fixed: col.fixed as 'left' | 'right' | undefined};
            if (col.title) columnOrder.push(idx);
        });
        this.eruptLocalSettings.patch(eruptName, {columns, columnOrder});
        this.st?.resetColumns();
    }

    private restoreColumnSettings(eruptName: string, columns: STColumn[]) {
        const saved = this.eruptLocalSettings.get(eruptName);
        const savedCols = saved.columns || {};
        columns.forEach(col => {
            if (!col.index) return;
            const cfg = savedCols[this.colIndexStr(col)];
            if (!cfg) return;
            if (cfg.show !== undefined) col['show'] = cfg.show;
            if (cfg.width !== undefined) col.width = cfg.width;
            col.fixed = cfg.fixed;
        });
        if (saved.columnOrder?.length) {
            const orderMap = new Map(saved.columnOrder.map((idx, i) => [idx, i]));
            const viewCols = columns.filter(col => col.title && col.index);
            viewCols.sort((a, b) => {
                const ai = orderMap.get(this.colIndexStr(a)) ?? Infinity;
                const bi = orderMap.get(this.colIndexStr(b)) ?? Infinity;
                return ai - bi;
            });
            let vi = 0;
            for (let i = 0; i < columns.length; i++) {
                if (columns[i].title && columns[i].index) columns[i] = viewCols[vi++];
            }
        }
    }

    get columnListForCtrl(): STColumn[] {
        return this.columns.filter(col => col.title && col.index);
    }

    onColumnDrop(event: CdkDragDrop<STColumn[]>) {
        if (event.previousIndex === event.currentIndex) return;
        const viewCols = this.columns.filter(col => col.title && col.index);
        moveItemInArray(viewCols, event.previousIndex, event.currentIndex);
        let vi = 0;
        this.columns = this.columns.map(col => (col.title && col.index) ? viewCols[vi++] : col);
        this.saveColumnSettings();
    }

    cycleColumnPin(col: STColumn) {
        if (!col.fixed) col.fixed = 'left';
        else if (col.fixed === 'left') col.fixed = 'right';
        else col.fixed = undefined;
        this.columns = [...this.columns];
        this.saveColumnSettings();
    }

    getColumnPinTooltip(col: STColumn): string {
        if (!col.fixed) return this.i18n.fanyi('table.column.pin.left');
        if (col.fixed === 'left') return this.i18n.fanyi('table.column.pin.right');
        return this.i18n.fanyi('table.column.unpin');
    }

    setAutoRefresh(seconds: number) {
        this.autoRefreshSeconds = seconds;
        if (this.refreshTimeInterval) {
            clearInterval(this.refreshTimeInterval);
            this.refreshTimeInterval = null;
        }
        if (seconds > 0) {
            this.refreshTimeInterval = setInterval(() => this.query(), seconds * 1000);
        }
    }

    duplicateRow() {
        const selectedRow = this.selectedRows[0];
        const pkCol = this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
        const id = selectedRow[pkCol];
        const eruptName = this.eruptBuildModel.eruptModel.eruptName;
        this.dataService.queryEruptDataById(eruptName, id).subscribe(data => {
            delete data[pkCol];
            let fullLine = false;
            const layout = this.eruptBuildModel.eruptModel.eruptJson.layout;
            if (layout && layout.formSize == FormSize.FULL_LINE) fullLine = true;
            const modal = this.modal.create({
                nzDraggable: true,
                nzStyle: {top: "60px"},
                nzWrapClassName: fullLine ? null : "modal-lg edit-modal-lg",
                nzWidth: fullLine ? 550 : null,
                nzMaskClosable: false,
                nzKeyboard: false,
                nzTitle: this.i18n.fanyi("global.copy"),
                nzContent: EditComponent,
                nzOkText: this.i18n.fanyi("global.add"),
                nzOnOk: async () => {
                    if (!this.adding) {
                        this.adding = true;
                        setTimeout(() => this.adding = false, 500);
                        if (modal.getContentComponent().beforeSaveValidate()) {
                            let header: any = {};
                            if (this.linkTree) {
                                const lt = this.eruptBuildModel.eruptModel.eruptJson.linkTree;
                                if (lt.dependNode && lt.value) header["link"] = lt.value;
                            }
                            if (this._drill) Object.assign(header, DataService.drillToHeader(this._drill));
                            await this.dataService.addEruptData(
                                eruptName,
                                this.dataHandler.eruptValueToObject(this.eruptBuildModel),
                                header
                            ).toPromise().then(res => res);
                            this.msg.success(this.i18n.fanyi("global.add.success"));
                            this.query();
                            return true;
                        }
                    }
                    return false;
                }
            });
            const editComp = modal.getContentComponent();
            editComp.eruptBuildModel = this.eruptBuildModel;
            editComp.behavior = Scene.ADD;
            editComp.prefillData = data;
            editComp.header = this._drill ? DataService.drillToHeader(this._drill) : {};
        });
    }

    resetColumnWidths() {
        const eruptName = this.eruptBuildModel.eruptModel.eruptName;
        const saved = this.eruptLocalSettings.get(eruptName);
        if (saved.columns) {
            const cleaned: Record<string, EruptColumnConfig> = {};
            Object.entries(saved.columns).forEach(([k, v]) => {
                cleaned[k] = {show: v.show, fixed: v.fixed};
            });
            this.eruptLocalSettings.patch(eruptName, {columns: cleaned});
        }
        this.buildTableConfig();
    }


    protected readonly SortType = SortType;

    // determine whether a field is a numeric or date type
    isNumericOrDateType(field: View): boolean {
        return field.type === ViewType.NUMBER ||
            field.type === ViewType.DATE ||
            field.type === ViewType.DATE_TIME;
    }

    // get the list of available fields (excluding already selected ones)
    getAvailableFields(): View[] {
        return this.sortFields.filter(f => !this.selectedSorts.some(s => s.field.column === f.column));
    }

    // add a sort field
    addSortField(field: View) {
        if (!this.selectedSorts.some(s => s.field.column === field.column)) {
            this.selectedSorts.push({
                field: field,
                direction: SortType.ASC
            });
        }
    }

    // remove a sort field
    removeSortField(index: number) {
        this.selectedSorts.splice(index, 1);
    }

    // drag-and-drop sort
    onSortDrop(event: CdkDragDrop<Array<{ field: View, direction: SortType }>>) {
        moveItemInArray(this.selectedSorts, event.previousIndex, event.currentIndex);
    }

    // apply sort
    applySort() {
        if (this.selectedSorts.length === 0) {
            this.dataPage.sort = null;
        } else {
            let sortObj = {};
            this.selectedSorts.forEach(sort => {
                sortObj[sort.field.column] = sort.direction;
            });
            this.dataPage.sort = sortObj;
        }
        this.showSortPopover = false;
        this.query(1, this.dataPage.ps, this.dataPage.sort);
    }

    // handle field selection change
    onFieldSelectChange(field: View) {
        if (field) {
            this.addSortField(field);
            // clear the selection so the same field can be selected again
            setTimeout(() => {
                this.tempSelectedField = null;
            }, 0);
        }
    }

    private _printPk: any;
    private _printSelectRef: NzModalRef;
    printLoading: boolean = false;

    printSelectedRows() {
        const eruptName = this.eruptBuildModel.eruptModel.eruptName;
        this._printPk = this.selectedRows[0][this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol];
        this.printLoading = true;
        this.dataService.printConfigList(eruptName).subscribe({
            next: res => {
                this.printLoading = false;
                const configs = res.data || [];
                if (configs.length === 0) {
                    this.builtinPrint(this._printPk);
                } else {
                    this.printSelectData = configs;
                    this._printSelectRef = this.modal.create({
                        nzTitle: this.i18n.fanyi("print.select_layout"),
                        nzContent: this.printSelectTpl,
                        nzDraggable: true,
                        nzWidth: 400,
                        nzBodyStyle: {padding: '0'},
                        nzFooter: null
                    });
                }
            },
            error: () => {
                this.printLoading = false;
                this.builtinPrint(this._printPk);
            }
        });
    }

    onPrintSelect(cfg: any) {
        this._printSelectRef?.close();
        const eruptName = this.eruptBuildModel.eruptModel.eruptName;
        if (!cfg) {
            this.builtinPrint(this._printPk);
        } else {
            this.doTemplatePrint(eruptName, this._printPk, cfg);
        }
    }

    private builtinPrint(pk: any) {
        this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, pk).subscribe(data => {
            const printBuildModel = cloneDeep(this.eruptBuildModel);
            this.dataHandler.objectToEruptValue(data, printBuildModel);
            const modal = this.modal.create({
                nzTitle: this.i18n.fanyi("print.preview"),
                nzContent: PrintTypeComponent,
                nzWidth: 700,
                nzStyle: {top: '30px'},
                nzBodyStyle: {maxHeight: '75vh', overflow: 'auto'},
                nzMaskClosable: false,
                nzDraggable: true,
                nzOkText: this.i18n.fanyi("global.print"),
                nzOnOk: () => {
                    modal.getContentComponent().print();
                    return false;
                }
            });
            modal.getContentComponent().eruptBuildModel = printBuildModel;
        });
    }

    private doTemplatePrint(eruptName: string, pk: any, config: { content: string, pageConfig: any }) {
        this.dataService.renderPrint(eruptName, pk, config.content).subscribe(res => {
            const pc = config.pageConfig || {};
            const pageSize = (!pc.paperSize || pc.paperSize === 'Custom') ? 'auto' : `${pc.paperSize} ${pc.orientation || 'portrait'}`;
            const margin = `${pc.marginTop || 10}mm ${pc.marginRight || 10}mm ${pc.marginBottom || 10}mm ${pc.marginLeft || 10}mm`;
            printJS({
                printable: res.data,
                type: 'raw-html',
                style: `* { font-family: 'Heiti SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { size: ${pageSize}; margin: ${margin}; }`
            });
        });
    }

    // ── Config: template list CRUD ──
    managePrintConfig() {
        const eruptName = this.eruptBuildModel.eruptModel.eruptName;
        this.dataService.printConfigList(eruptName).subscribe(res => {
            this.showPrintConfigList(eruptName, res.data || []);
        });
    }

    private showPrintConfigList(eruptName: string, configs: any[]) {
        this.printConfigListData = configs;
        this.printConfigListRef = this.modal.create({
            nzTitle: this.i18n.fanyi("print.layout"),
            nzContent: this.printConfigListTpl,
            nzDraggable: true,
            nzBodyStyle: {
                padding: '0'
            },
            nzWidth: 420,
            nzFooter: [{
                label: this.i18n.fanyi("table.add"),
                type: 'primary',
                onClick: () => {
                    this.printConfigListRef.close();
                    this.editPrintConfig(this.eruptBuildModel.eruptModel.eruptName,
                        {erupt: this.eruptBuildModel.eruptModel.eruptName, title: '', content: '', pageConfig: null});
                }
            }]
        });
    }

    deletePrintConfig(cfg: any) {
        const eruptName = this.eruptBuildModel.eruptModel.eruptName;
        this.dataService.printConfigDelete(eruptName, cfg.id).subscribe(() => {
            this.msg.success(this.i18n.fanyi("global.delete.success"));
            this.printConfigListData = this.printConfigListData.filter(c => c.id !== cfg.id);
        });
    }

    editPrintConfig(eruptName: string, cfg: any) {
        this.printConfigListRef?.close();
        const vars: PrintVar[] = [];
        this.eruptBuildModel.eruptModel.eruptFieldModels.forEach(f => {
            if (f.eruptFieldJson.edit.title) {
                vars.push({value: f.fieldName, label: f.eruptFieldJson.edit.title});
            }
        });
        const isNew = !cfg.id;
        const ref = this.modal.create({
            nzTitle: isNew ? this.i18n.fanyi("global.new") : cfg.title,
            nzDraggable: true,
            nzContent: PrintTemplate,
            nzWidth: '900px',
            nzStyle: {top: '30px'},
            nzMaskClosable: false,
            nzKeyboard: false,
            nzOnOk: () => {
                const comp = ref.getContentComponent();
                const title = comp.getTitle()?.trim();
                if (!title) {
                    this.msg.warning(this.i18n.fanyi("print.input_title"));
                    return false as any;
                }
                const content = comp.getContent();
                const pageConfig = comp.getPageConfig();
                const data = {erupt: eruptName, title, content, pageConfig};
                const api = isNew
                    ? this.dataService.printConfigAdd(eruptName, data)
                    : this.dataService.printConfigUpdate(eruptName, {...data, id: cfg.id});
                api.subscribe(() => {
                    this.msg.success(this.i18n.fanyi(isNew ? "global.add.success" : "global.update.success"));
                    this.managePrintConfig();
                });
            }
        });
        const comp = ref.getContentComponent();
        comp.height = 460;
        comp.vars = vars;
        comp.value = cfg.content || '';
        comp.showTitle = true;
        comp.configTitle = cfg.title || '';
        comp.pageConfig = cfg.pageConfig || {
            paperSize: 'A4', orientation: 'portrait',
            marginTop: 10, marginRight: 10, marginBottom: 10, marginLeft: 10
        };
    }

    protected readonly TableSize = TableSize;
}

