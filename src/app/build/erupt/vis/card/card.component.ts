import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {CardLayout, CoverEffect, FieldVisibility, Page, Vis} from "../../model/erupt.model";
import {NzImageService} from "ng-zorro-antd/image";
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
            this.columnMap.set(String(col.index), col);
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

    get masonry(): boolean {
        return this.vis.cardView.layout === CardLayout.MASONRY;
    }

    // the first image of the cover field
    coverUrl(path: string): string {
        const fieldModel = this.eruptBuildModel.eruptModel.eruptFieldModelMap.get(this.vis.cardView.coverField);
        return DataService.previewAttachment(path.split(fieldModel?.eruptFieldJson.edit?.attachmentType?.fileSeparator || "|")[0]);
    }

    viewImageStyle(path: string): object {
        return {
            backgroundImage: 'url(' + this.coverUrl(path) + ')',
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
