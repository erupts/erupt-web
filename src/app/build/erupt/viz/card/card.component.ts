import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {CoverEffect, Page, Viz} from "../../model/erupt.model";
import {NzImageService} from "ng-zorro-antd/image";
import {EruptFieldModel} from "../../model/erupt-field.model";

@Component({
    selector: 'viz-card',
    templateUrl: './card.component.html',
    styles: [],
    styleUrls: ["./card.component.less"]
})
export class CardComponent implements OnInit {

    constructor(private imageService: NzImageService) {
    }

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() data: any[] = [];

    @Input() viz: Viz;

    page: Page;

    ngOnInit() {
        let eruptModel = this.eruptBuildModel.eruptModel;
        // this.cardView = eruptModel.eruptJson.cardView;
    }

    viewImageStyle(path: string, eruptFieldModel: EruptFieldModel): object {
        return {
            backgroundImage: 'url(' + DataService.previewAttachment(path.split(eruptFieldModel.eruptFieldJson.edit?.attachmentType?.fileSeparator || "|")[0]) + ')',
            backgroundSize: this.viz.cardView.coverEffect == CoverEffect.FIT ? "contain" : "cover",
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


}
