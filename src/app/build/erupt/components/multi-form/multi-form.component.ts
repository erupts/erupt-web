import {Component, DoCheck, Input, OnInit} from "@angular/core";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EruptModel} from "../../model/erupt.model";
import {EditType} from "../../model/erupt.enum";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../service/data-handler.service";
import {colRules} from "@shared/model/util.model";

export interface MultiFormBlock {
    build: EruptBuildModel;
    pk: any;
}

@Component({
    standalone: false,
    selector: "erupt-multi-form",
    templateUrl: "./multi-form.component.html",
    styleUrls: ["./multi-form.component.less"]
})
export class MultiFormComponent implements OnInit, DoCheck {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() tabErupt: {
        eruptBuildModel: EruptBuildModel;
        eruptFieldModel: EruptFieldModel;
    };

    @Input() onlyRead: boolean = false;

    // menu-bound ancestor erupt: set when this component is itself nested inside another sub-form
    @Input() eruptParentName: string;

    blocks: MultiFormBlock[] = [];

    col = colRules[3];

    adding: boolean = false;

    pageIndex: number = 1;

    readonly pageSize: number = 5;

    private template: string;

    private builtFrom: any;

    constructor(private dataService: DataService,
                private dataHandlerService: DataHandlerService) {
    }

    get edit() {
        return this.tabErupt.eruptFieldModel.eruptFieldJson.edit;
    }

    get pagedBlocks(): MultiFormBlock[] {
        return this.blocks.slice((this.pageIndex - 1) * this.pageSize, this.pageIndex * this.pageSize);
    }

    get pageOffset(): number {
        return (this.pageIndex - 1) * this.pageSize;
    }

    get anchorEruptName(): string {
        return this.eruptParentName || this.eruptBuildModel.eruptModel.eruptName;
    }

    ngOnInit() {
        this.template = JSON.stringify(this.tabErupt.eruptBuildModel);
        this.syncFromValue();
    }

    // rebuild blocks when $value is replaced after init (e.g. async detail loading in view mode)
    ngDoCheck() {
        if (this.edit.$value !== this.builtFrom) {
            this.syncFromValue();
        }
    }

    addBlock() {
        this.adding = true;
        this.dataService.getInitValue(this.tabErupt.eruptBuildModel.eruptModel.eruptName,
            this.anchorEruptName).subscribe({
            next: data => {
                let build = this.createBuild();
                this.dataHandlerService.objectToEruptValue(data || {}, build);
                this.blocks.push({build: build, pk: null});
                this.pageIndex = Math.ceil(this.blocks.length / this.pageSize);
                this.adding = false;
            },
            error: () => {
                this.adding = false;
            }
        });
    }

    copyBlock(index: number) {
        let data = this.dataHandlerService.eruptValueToObject(this.blocks[index].build);
        this.stripPk(data, this.tabErupt.eruptBuildModel);
        let build = this.createBuild();
        this.dataHandlerService.objectToEruptValue(data, build);
        this.blocks.push({build: build, pk: null});
        this.pageIndex = Math.ceil(this.blocks.length / this.pageSize);
    }

    removeBlock(index: number) {
        this.blocks.splice(index, 1);
        let maxPage = Math.max(1, Math.ceil(this.blocks.length / this.pageSize));
        if (this.pageIndex > maxPage) {
            this.pageIndex = maxPage;
        }
    }

    private syncFromValue() {
        this.builtFrom = this.edit.$value;
        this.blocks = [];
        this.pageIndex = 1;
        let pkCol = this.tabErupt.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
        for (let row of (this.edit.$value || [])) {
            let build = this.createBuild();
            this.dataHandlerService.objectToEruptValue(row, build);
            this.blocks.push({build: build, pk: row[pkCol]});
        }
        if (!this.onlyRead) {
            this.edit.$tempValue = this.blocks;
        }
    }

    // a copied block must become a brand-new entity, including its one-to-many children
    private stripPk(data: any, build: EruptBuildModel) {
        if (!data) {
            return;
        }
        delete data[build.eruptModel.eruptJson.primaryKeyCol];
        for (let key in build.tabErupts || {}) {
            let field = build.eruptModel.eruptFieldModelMap.get(key);
            // TAB_TABLE_REFER rows only reference existing entities, their pk must survive
            if (field && field.eruptFieldJson.edit.type == EditType.TAB_TABLE_REFER) {
                continue;
            }
            if (Array.isArray(data[key])) {
                for (let row of data[key]) {
                    this.stripPk(row, build.tabErupts[key]);
                }
            }
        }
    }

    private createBuild(): EruptBuildModel {
        let build: EruptBuildModel = JSON.parse(this.template);
        this.rebuild(build);
        return build;
    }

    // restore Map instances lost during the JSON deep clone
    private rebuild(build: EruptBuildModel) {
        this.rebuildModel(build.eruptModel);
        for (let key in build.tabErupts || {}) {
            this.rebuild(build.tabErupts[key]);
        }
        for (let key in build.combineErupts || {}) {
            this.rebuildModel(build.combineErupts[key]);
        }
        for (let key in build.referenceErupts || {}) {
            this.rebuildModel(build.referenceErupts[key]);
        }
    }

    private rebuildModel(eruptModel: EruptModel) {
        eruptModel.eruptFieldModelMap = new Map();
        for (let field of eruptModel.eruptFieldModels) {
            eruptModel.eruptFieldModelMap.set(field.fieldName, field);
            if (field.componentValue) {
                field.choiceMap = new Map();
                field.choiceLabelMap = new Map();
                for (let vl of field.componentValue) {
                    field.choiceMap.set(vl.value, vl);
                    field.choiceLabelMap.set(vl.label, vl);
                }
            }
        }
    }

}
