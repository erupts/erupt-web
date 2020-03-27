import {Component, Input, OnInit} from '@angular/core';
import {EruptFieldModel} from "../../model/erupt-field.model";

@Component({
    selector: 'erupt-code-editor',
    templateUrl: './code-editor.component.html',
    styleUrls: ["./code-editor.component.less"]
})
export class CodeEditorComponent implements OnInit {

    @Input() field: EruptFieldModel;

    constructor() {
    }

    ngOnInit() {
    }

    codeEditorInit(event, field?: EruptFieldModel) {
        event.setValue(field.eruptFieldJson.edit.$value || '');
        field.eruptFieldJson.edit.$viewValue = event;
    }

}
