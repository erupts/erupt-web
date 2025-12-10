import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {CoverEffect, Page, Vis} from "../../model/erupt.model";
import {NzImageService} from "ng-zorro-antd/image";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {UiBuildService} from "../../service/ui-build.service";
import {STColumn} from "@delon/abc/st";

@Component({
    selector: 'vis-card',
    templateUrl: './card.component.html',
    styles: [],
    styleUrls: ["./card.component.less"]
})
export class CardComponent implements OnInit {

    constructor(private imageService: NzImageService, private uiBuildService: UiBuildService) {
    }

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() data: any[] = [];

    @Input() vis: Vis;

    columnMap: Map<any, STColumn>;

    @Output() onEdit = new EventEmitter<any>();

    page: Page;

    ngOnInit() {
        this.columnMap = new Map<string, STColumn>()
        for (let col of this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true)) {
            this.columnMap.set(col.index, col);
        }
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
}
