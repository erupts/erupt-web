import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {CardView, GalleryCover, Page} from "../../model/erupt.model";
import {WindowModel} from "@shared/model/window.model";
import {NzImageService} from "ng-zorro-antd/image";

@Component({
    selector: 'erupt-card',
    templateUrl: './card.component.html',
    styles: [],
    styleUrls: ["./card.component.less"]
})
export class CardComponent implements OnInit {

    constructor(private dataService: DataService, private imageService: NzImageService,) {
    }

    @Input() eruptBuildModel: EruptBuildModel;

    windowModel: WindowModel;

    page: Page;

    cardView: CardView;

    index = 1;

    size = 12;

    ngOnInit() {
        let eruptModel = this.eruptBuildModel.eruptModel;
        this.cardView = eruptModel.eruptJson.cardView;
        this.query();
    }

    query() {
        // let eruptModel = this.eruptBuildModel.eruptModel;
        // this.dataService.queryEruptTableData(eruptModel.eruptName, {
        //     pageIndex: this.index,
        //     pageSize: this.size
        // }).subscribe(page => {
        //     this.page = page;
        // });
    }


    viewImage(path: string): string {
        return DataService.previewAttachment(path);
    }

    viewImageStyle(path: string): object {
        return {
            backgroundImage: 'url(' + DataService.previewAttachment(path.split("|")[0]) + ')',
            backgroundSize: this.cardView.galleryCover == GalleryCover.FIT ? "contain" : "cover"
        };
    }

    previewImage(path: string) {
        this.imageService.preview(path.split("|").map(it => {
            return {
                src: DataService.previewAttachment(it.trim())
            }
        }))
    }

    pageIndexChange(index) {
        this.index = index;
        this.query();
    }

    pageSizeChange(size) {
        this.size = size;
        this.query();
    }


}
