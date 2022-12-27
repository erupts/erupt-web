import {Component, Input, OnInit} from '@angular/core';
import {Edit} from "../../model/erupt-field.model";
import {CacheService} from "@delon/cache";
import {NzConfigService} from "ng-zorro-antd/core/config";

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

    constructor(private nzConfigService: NzConfigService, private cacheService: CacheService) {

    }

    ngOnInit() {
        this.dark = this.cacheService.getNone(codeEditorDarkKey) || false;
    }

    // codeEditorInit(event) {
    //     // if (this.edit) {
    //     //     this.edit.$viewValue = event;
    //     //     event.setValue(this.edit.$value || '');
    //     // } else {
    //     //     event.setValue(this.value || '');
    //     // }
    //     this.codeEditorEvent = event;
    //     const defaultEditorOption = this.nzConfigService.getConfigForComponent('codeEditor')?.defaultEditorOption || {};
    //     this.nzConfigService.set('codeEditor', {
    //         defaultEditorOption: {
    //             ...defaultEditorOption,
    //             theme: this.dark ? 'vs-dark' : 'vs',
    //             readOnly: this.readonly
    //         }
    //     });
    // }
    //
    // switchChange(bool) {
    //     this.dark = bool;
    //     this.cacheService.set(codeEditorDarkKey, bool);
    //
    //     const defaultEditorOption = this.nzConfigService.getConfigForComponent('codeEditor')?.defaultEditorOption || {};
    //     this.nzConfigService.set('codeEditor', {
    //         defaultEditorOption: {
    //             ...defaultEditorOption,
    //             theme: this.dark ? 'vs-dark' : 'vs',
    //             readOnly: this.readonly
    //         }
    //     });
    // }

}
