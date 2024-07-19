import {Component, Inject} from '@angular/core';
import {View} from "../../model/erupt-field.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {ViewType} from "../../model/erupt.enum";
import {DataService} from "@shared/service/data.service";
import {ViewTypeComponent} from "../view-type/view-type.component";

@Component({
    selector: 'app-attachment-select',
    templateUrl: './attachment-select.component.html',
    styleUrls: ['./attachment-select.component.less']
})
export class AttachmentSelectComponent {

    paths: string[] = [];

    view: View;

    constructor(@Inject(NzModalService) private modal: NzModalService) {
    }

    open(path) {
        if (this.view.viewType == ViewType.DOWNLOAD || this.view.viewType == ViewType.ATTACHMENT) {
            window.open(DataService.downloadAttachment(path));
        } else if (this.view.viewType == ViewType.ATTACHMENT_DIALOG) {
            let ref = this.modal.create({
                nzWrapClassName: "modal-lg modal-body-nopadding",
                nzStyle: {top: "30px"},
                nzKeyboard: true,
                nzFooter: null,
                nzContent: ViewTypeComponent
            });
            Object.assign(ref.getContentComponent(), {
                value: path,
                view: this.view
            });
        }
    }

}
