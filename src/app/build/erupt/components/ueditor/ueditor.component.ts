import {Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EruptModel} from "../../model/erupt.model";
import {RestPath} from "../../model/erupt.enum";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {WindowModel} from "@shared/model/window.model";
import {UEditorComponent} from "ngx-ueditor";

@Component({
    selector: 'erupt-ueditor',
    templateUrl: './ueditor.component.html',
    styles: []
})
export class UeditorComponent implements OnInit {

    @Input() eruptField: EruptFieldModel;

    @Input() erupt: EruptModel;

    @Input() readonly: boolean;

    @ViewChild("ue") ue: UEditorComponent;

    serverPath: string;

    constructor(@Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    ngOnInit() {
        let rf = RestPath.file;
        if (!WindowModel.domain) {
            rf = window.location.pathname + rf;
        }
        this.serverPath = rf + "/upload-ueditor/" + this.erupt.eruptName + "/" +
            this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token;

    }

}
