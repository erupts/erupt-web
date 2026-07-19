import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {CoverEffect, FieldVisibility, Page, Vis} from "../../model/erupt.model";
import {NzImageService} from "ng-zorro-antd/image";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {UiBuildService} from "../../service/ui-build.service";
import {STColumn} from "@delon/abc/st";
import {SelectMode} from "../../model/erupt.enum";

@Component({
    standalone: false,
    selector: 'vis-card',
    templateUrl: './card.component.html',
    styles: [],
    styleUrls: ["./card.component.less"]
})
export class CardComponent implements OnInit, OnChanges {

    constructor(private imageService: NzImageService, private uiBuildService: UiBuildService) {
    }

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() data: any[] = [];

    @Input() vis: Vis;

    @Input() selectionMode: SelectMode | null = null;

    columnMap: Map<any, STColumn>;

    @Output() onEdit = new EventEmitter<any>();

    @Output() onSelectionChange = new EventEmitter<any[]>();

    selectedKeys: Set<any> = new Set<any>();

    page: Page;

    ngOnInit() {
        this.columnMap = new Map<string, STColumn>()
        for (let col of this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true)) {
            this.columnMap.set(col.index, col);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['data'] && !changes['data'].firstChange) {
            this.selectedKeys.clear();
            this.onSelectionChange.emit([]);
        }
    }

    private get primaryKeyCol(): string {
        return this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
    }

    isSelected(d: any): boolean {
        return this.selectedKeys.has(d[this.primaryKeyCol]);
    }

    toggleSelection(d: any) {
        let key = d[this.primaryKeyCol];
        if (this.selectedKeys.has(key)) {
            this.selectedKeys.delete(key);
        } else {
            if (this.selectionMode === SelectMode.radio) {
                this.selectedKeys.clear();
            }
            this.selectedKeys.add(key);
        }
        this.onSelectionChange.emit(this.data.filter(it => this.selectedKeys.has(it[this.primaryKeyCol])));
    }

    clickField(e,field: string) {
        e.stopPropagation();
        this.columnMap.get(field)?.click(this.data[0]);
    }

    viewImageStyle(path: string, eruptFieldModel: EruptFieldModel): object {
        return {
            backgroundImage: 'url(' + DataService.previewAttachment(path.split(eruptFieldModel.eruptFieldJson.edit?.attachmentType?.fileSeparator || "|")[0]) + ')',
            backgroundSize: this.vis.cardView.coverEffect == CoverEffect.FIT ? "contain" : "cover",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
        };
    }

    previewImage(path: string) {
        this.imageService.preview(path.split("|").map(it => {
            return {
                src: DataService.previewAttachment(it.trim())
            }
        }))
    }


    protected readonly clearInterval = clearInterval;
    protected readonly FieldVisibility = FieldVisibility;
    protected readonly SelectMode = SelectMode;
}
