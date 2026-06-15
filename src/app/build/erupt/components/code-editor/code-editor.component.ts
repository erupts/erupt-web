import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Edit} from "../../model/erupt-field.model";
import {CacheService} from "@delon/cache";
import {JoinedEditorOptions, NzCodeEditorComponent} from "ng-zorro-antd/code-editor";
import {NzConfigService} from "ng-zorro-antd/core/config";
import {DataService} from "@shared/service/data.service";

let codeEditorDarkKey = "code_editor_dark";

@Component({
    standalone: false,
    selector: 'erupt-code-editor',
    templateUrl: './code-editor.component.html',
    styleUrls: ["./code-editor.component.less"]
})
export class CodeEditorComponent implements OnInit, OnDestroy {

    /**
     * choice field or value
     */
    @Input() edit: Edit;

    @Input() language: string;

    @Input() readonly: boolean = false;

    @Input() height: number = 300;

    @Input() eruptName: string;

    @Input() fieldName: string;

    @Input() parentEruptName: string;

    @ViewChild(NzCodeEditorComponent, {static: false}) editorComponent?: NzCodeEditorComponent;

    initComplete: boolean = false;

    fullscreen = false;

    dark = false;

    theme: 'vs-dark' | 'vs';

    editorOption: JoinedEditorOptions;

    private _completionProvider: any;
    private _hintsCache: string[] | null = null;

    constructor(private cacheService: CacheService, private nzConfigService: NzConfigService, private dataService: DataService) {
    }

    ngOnInit() {
        this.dark = this.cacheService.getNone(codeEditorDarkKey) || false;
        this.theme = this.dark ? 'vs-dark' : 'vs';
        this.editorOption = {
            language: this.language,
            theme: this.theme,
            readOnly: this.readonly,
            suggestOnTriggerCharacters: true,
            automaticLayout: true,
            minimap: {enabled: true},
            scrollBeyondLastLine: false
        };
    }

    codeEditorInit(editor: any) {
        this.initComplete = true;
        setTimeout(() => this.editorComponent?.layout(), 100);

        const codeEditType = this.edit?.codeEditType;
        if (codeEditType) {
            if (codeEditType.hintHandler && codeEditType.hintHandler.length) {
                const monaco = (window as any).monaco;
                if (!monaco) return;
                const modelUri = editor.getModel()?.uri?.toString();

                this._completionProvider = monaco.languages.registerCompletionItemProvider(
                    codeEditType.language || this.language,
                    {
                        provideCompletionItems: (model: any, position: any) => {
                            if (model.uri?.toString() !== modelUri) {
                                return {suggestions: []};
                            }
                            const wordInfo = model.getWordUntilPosition(position);
                            const buildSuggestions = (hints: string[]) => ({
                                suggestions: hints.map((h: string) => ({
                                    label: h,
                                    kind: monaco.languages.CompletionItemKind.Variable,
                                    insertText: h,
                                    range: {
                                        startLineNumber: position.lineNumber,
                                        endLineNumber: position.lineNumber,
                                        startColumn: wordInfo.startColumn,
                                        endColumn: wordInfo.endColumn
                                    }
                                }))
                            });
                            if (this._hintsCache) {
                                return buildSuggestions(this._hintsCache);
                            }
                            return this.dataService.getCodeEditHints(
                                this.eruptName, this.fieldName, this.parentEruptName
                            ).toPromise().then((hints: string[]) => {
                                this._hintsCache = hints || [];
                                return buildSuggestions(this._hintsCache);
                            });
                        }
                    }
                );
            }
        }
    }

    ngOnDestroy() {
        this._completionProvider?.dispose();
    }

    switchChange(bool: boolean) {
        this.dark = bool;
        this.theme = this.dark ? 'vs-dark' : 'vs';
        this.cacheService.set(codeEditorDarkKey, this.dark);
        const defaultEditorOption = this.nzConfigService.getConfigForComponent('codeEditor')?.defaultEditorOption || {};
        this.nzConfigService.set('codeEditor', {
            defaultEditorOption: {
                ...defaultEditorOption,
                theme: this.theme
            }
        });
        setTimeout(() => this.editorComponent?.layout(), 100);
    }

    copyCode() {
        if (this.edit.$value) {
            navigator.clipboard.writeText(this.edit.$value);
        }
    }

    toggleFullscreen() {
        this.fullscreen = !this.fullscreen;
        setTimeout(() => this.editorComponent?.layout(), 100);
    }

}
