import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {Page, Viz} from "../../model/erupt.model";
import {NzImageService} from "ng-zorro-antd/image";

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

    // cardView: CardView;

    ngOnInit() {
        let eruptModel = this.eruptBuildModel.eruptModel;
        // this.cardView = eruptModel.eruptJson.cardView;
    }

    // viewImageStyle(path: string): object {
    //     return {
    //         backgroundImage: 'url(' + DataService.previewAttachment(path.split("|")[0]) + ')',
    //         backgroundSize: this.cardView.galleryCover == GalleryCover.FIT ? "contain" : "cover"
    //     };
    // }

    previewImage(path: string) {
        this.imageService.preview(path.split("|").map(it => {
            return {
                src: DataService.previewAttachment(it.trim())
            }
        }))
    }


}
