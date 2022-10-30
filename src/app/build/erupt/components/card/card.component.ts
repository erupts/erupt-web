import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {CardView, GalleryCover, Page} from "../../model/erupt.model";
import {WindowModel} from "@shared/model/window.model";

@Component({
    selector: 'erupt-card',
    templateUrl: './card.component.html',
    styles: [],
    styleUrls: ["./card.component.less"]
})
export class CardComponent implements OnInit {

    constructor(private dataService: DataService) {
    }

    @Input() eruptBuildModel: EruptBuildModel;

    windowModel: WindowModel;

    page: Page;

    cardView: CardView;

    galleryCover = GalleryCover;

    ngOnInit() {
        let eruptModel = this.eruptBuildModel.eruptModel;
        this.cardView = eruptModel.eruptJson.cardView;
        this.dataService.queryEruptTableData(eruptModel.eruptName, {
            pageIndex: 1,
            pageSize: 12
        }).subscribe(page => {
            this.page = page;
        });

    }

    viewImage(path: string): string {
        return DataService.previewAttachment(path);
    }

}
