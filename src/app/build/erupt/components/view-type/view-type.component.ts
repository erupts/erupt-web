import {AfterViewInit, Component, Input, OnInit, ViewChild} from "@angular/core";
import {View} from "../../model/erupt-field.model";
import {EditType, ViewType} from "../../model/erupt.enum";
import {DataService} from "@shared/service/data.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataHandlerService} from "../../service/data-handler.service";
import {NzCarouselComponent} from "ng-zorro-antd/carousel";

@Component({
    selector: "erupt-view-type",
    templateUrl: "./view-type.component.html",
    styleUrls: ["./view-type.component.less"],
    styles: []
})
export class ViewTypeComponent implements OnInit, AfterViewInit {

    @Input() view: View;

    @Input() value: any;

    @Input() eruptName: string;

    @Input() eruptBuildModel: EruptBuildModel;

    loading: boolean = false;

    show: boolean = false;

    paths: string[] = [];

    editType = EditType;

    viewType = ViewType;

    constructor(private dataService: DataService, private dataHandler: DataHandlerService) {
    }

    ngOnInit() {
        switch (this.view.viewType) {
            case ViewType.TAB_VIEW:
                this.loading = true;
                this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.value).subscribe(data => {
                    this.dataHandler.objectToEruptValue(data, this.eruptBuildModel);
                    this.loading = false;
                });
                break
            case ViewType.ATTACHMENT_DIALOG:
            case ViewType.ATTACHMENT:
            case ViewType.DOWNLOAD:
            case ViewType.IMAGE:
            case ViewType.SWF:
                if (this.value) {
                    if (this.view.eruptFieldModel.eruptFieldJson.edit.type === EditType.ATTACHMENT) {
                        const attachmentType = this.view.eruptFieldModel.eruptFieldJson.edit.attachmentType;
                        let _paths = (<string>this.value).split(attachmentType.fileSeparator);
                        for (let path of _paths) {
                            this.paths.push(DataService.previewAttachment(path));
                        }
                    } else {
                        let _paths = (<string>this.value).split("|");
                        for (let path of _paths) {
                            this.paths.push(DataService.previewAttachment(path));
                        }
                    }
                    if (this.view.viewType == ViewType.ATTACHMENT_DIALOG) {
                        this.value = [DataService.previewAttachment(this.value)];
                    }
                }
                break;
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.show = true;
        }, 200);
    }

    @ViewChild("carousel", {static: false}) carouselComponent: NzCarouselComponent;

    currIndex: number = 0;

    goToCarouselIndex(index) {
        this.carouselComponent.goTo(index);
        this.currIndex = index;
    }

}
