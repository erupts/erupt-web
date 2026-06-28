import {Component, Inject, Input, OnInit, SimpleChanges, OnChanges, ViewChild} from '@angular/core';
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EruptModel} from "../../model/erupt.model";
import {RestPath} from "../../model/erupt.enum";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {WindowModel} from "@shared/model/window.model";
import {UEditorComponent} from "@shared/component/ueditor/ueditor.component";

@Component({
    standalone: false,
    selector: 'erupt-ueditor',
    template: `
        <ueditor #ue [name]="eruptField.fieldName" [(ngModel)]="eruptField.eruptFieldJson.edit.$value"
                 [config]="editorConfig"></ueditor>

    `,
    styles: []
})
export class EruptUeditorComponent implements OnInit, OnChanges {

    @Input() eruptField: EruptFieldModel;

    @Input() erupt: EruptModel;

    @Input() readonly: boolean;

    @ViewChild("ue", {static: false}) ue: UEditorComponent;

    serverPath: string;
    editorConfig: any;

    constructor(@Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    ngOnInit() {
        let rf = RestPath.file;
        if (!WindowModel.domain) {
            rf = window.location.pathname + rf;
        }
        this.serverPath = rf + "/upload-ueditor/" + this.erupt.eruptName + "/" +
            this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token;
        this.editorConfig = {serverUrl: this.serverPath, readonly: this.readonly};
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['readonly'] && this.serverPath) {
            this.editorConfig = {serverUrl: this.serverPath, readonly: this.readonly};
        }
    }

}
