import {Component, Input, OnInit} from '@angular/core';
import {Edit} from "../../model/erupt-field.model";
import {CacheService} from "@delon/cache";
import {JoinedEditorOptions} from "ng-zorro-antd/code-editor/typings";

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

    @Input() parentEruptName: string;

    initComplete: boolean = false;

    codeEditorEvent: any;

    dark = false;

    theme: 'vs-dark' | 'vs';

    fullScreen = false;

    editorOption: JoinedEditorOptions;

    constructor(private cacheService: CacheService) {

    }

    ngOnInit() {
        this.dark = this.cacheService.getNone(codeEditorDarkKey) || false;
        this.theme = this.dark ? 'vs-dark' : 'vs';
        this.editorOption = {
            language: this.language,
            theme: this.theme,
            readOnly: this.readonly,
            suggestOnTriggerCharacters: true
        };
        // monaco.languages.registerCompletionItemProvider(this.edit.codeEditType.language, {
        //     provideCompletionItems(model, position) {
        //         return {
        //             suggestions: []
        //         };
        //     },
        //     triggerCharacters: ['$'] // 触发提示的字符，可以写多个
        // });
    }

    codeEditorInit(event) {
        this.initComplete = true;
    }

    switchChange(bool) {
        this.dark = bool;
        this.theme = this.dark ? 'vs-dark' : 'vs';
        this.cacheService.set(codeEditorDarkKey, this.dark);
    }

    toggleFullScreen(): void {
        // this.fullScreen = !this.fullScreen;
        // this.renderer.setStyle(this.document.body, 'overflow-y', this.fullScreen ? 'hidden' : null);
        // this.editorComponent?.layout();
        // this.tooltip?.hide();
    }

}
