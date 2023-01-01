import {Component, Input, OnInit} from '@angular/core';
import {Edit} from "../../model/erupt-field.model";
import {CacheService} from "@delon/cache";

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

    initComplete: boolean = false;

    codeEditorEvent: any;

    dark = false;

    theme: 'vs-dark' | 'vs';

    constructor(private cacheService: CacheService) {

    }

    ngOnInit() {
        this.dark = this.cacheService.getNone(codeEditorDarkKey) || false;
        this.theme = this.dark ? 'vs-dark' : 'vs';
    }

    codeEditorInit(event) {
        this.initComplete = true;
    }

    switchChange(bool) {
        this.dark = bool;
        this.theme = this.dark ? 'vs-dark' : 'vs';
        this.cacheService.set(codeEditorDarkKey, this.dark);
    }

}
