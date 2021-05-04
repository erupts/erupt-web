import {Component, Input, OnInit} from '@angular/core';
import {Edit, EruptFieldModel} from "../../model/erupt-field.model";
import {NzCodeEditorService} from "ng-zorro-antd/code-editor";
import {CacheService} from "@delon/cache";
import {GlobalKeys} from "@shared/model/erupt-const";

let codeEditorDarkKey = "code_editor_dark";

@Component({
    selector: 'erupt-code-editor',
    templateUrl: './code-editor.component.html',
    styleUrls: ["./code-editor.component.less"]
})
export class CodeEditorComponent implements OnInit {

    /**
     * choice field or value
     */
    @Input() edit: Edit;

    @Input() language: string;

    @Input() readonly: boolean = false;

    @Input() height: number = 300;

    codeEditorEvent: any;

    dark = false;

    constructor(private nzCodeEditorService: NzCodeEditorService, private cacheService: CacheService) {

    }

    ngOnInit() {
        this.dark = this.cacheService.getNone(codeEditorDarkKey) || false;
    }

    codeEditorInit(event) {
        // if (this.edit) {
        //     this.edit.$viewValue = event;
        //     event.setValue(this.edit.$value || '');
        // } else {
        //     event.setValue(this.value || '');
        // }
        this.codeEditorEvent = event;
        this.nzCodeEditorService.updateDefaultOption({theme: this.dark ? 'vs-dark' : 'vs', readOnly: this.readonly});
    }

    switchChange(bool) {
        this.dark = bool;
        this.cacheService.set(codeEditorDarkKey, bool);
        this.nzCodeEditorService.updateDefaultOption({theme: bool ? 'vs-dark' : 'vs'});
    }

}
