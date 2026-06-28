import {AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnDestroy, Output, SimpleChanges} from "@angular/core";
import {LazyService} from "@delon/util";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EruptModel} from "../../model/erupt.model";
import {RestPath} from "../../model/erupt.enum";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

@Component({
    standalone: false,
    selector: "ckeditor",
    templateUrl: "./ckeditor.component.html",
    styles: []
})
export class CkeditorComponent implements AfterViewInit, OnChanges, OnDestroy {

    @Input() eruptField?: EruptFieldModel;

    @Input() erupt?: EruptModel;

    @Input() value;

    @Input() readonly: boolean;

    @Output() valueChange = new EventEmitter();

    @Output() onReady = new EventEmitter<any>();

    public loading: boolean = true;
    public instance: any = null;

    editorError: boolean = false;

    private destroyed = false;

    constructor(private lazy: LazyService, private ref: ElementRef,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['value'] && this.instance) {
            const newVal = changes['value'].currentValue ?? '';
            // avoid re-triggering when the change came from the editor itself
            if (newVal !== this.instance.getData()) {
                this.instance.setData(newVal);
            }
        }
    }

    ngAfterViewInit() {
        this.lazy.loadScript("assets/js/ckeditor.js").then(() => new Promise<void>(resolve => setTimeout(resolve, 50))).then(() => {
            if (this.destroyed) return;
            const EditorCtor = (window as any).DecoupledDocumentEditor;
            if (!EditorCtor) {
                this.loading = false;
                this.editorError = true;
                console.error('DecoupledDocumentEditor global not found after script load');
                return;
            }
            const uploadUrl = (this.erupt && this.eruptField)
                ? RestPath.file + "/upload-html-editor/" + this.erupt.eruptName + "/" +
                  this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token
                : null;
            const config: any = {
                toolbar: {
                    items: [
                        'heading', '|',
                        'fontSize', 'fontFamily', 'fontBackgroundColor', 'fontColor', '|',
                        'bold', 'italic', 'underline', 'strikethrough', '|',
                        'alignment', '|',
                        'numberedList', 'bulletedList', '|',
                        'indent', 'outdent', '|',
                        'link', 'imageUpload', 'insertTable', 'codeBlock', 'blockQuote', 'highlight', '|',
                        'undo', 'redo', '|',
                        'code', 'horizontalLine', 'subscript', 'todoList', 'mediaEmbed'
                    ],
                    shouldNotGroupWhenFull: true
                },
                image: {
                    toolbar: ['imageTextAlternative', 'imageStyle:full', 'imageStyle:side']
                },
                table: {
                    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
                },
                licenseKey: '',
                language: "zh-cn"
            };
            if (uploadUrl) {
                config.ckfinder = {uploadUrl};
            }
            EditorCtor.create(this.ref.nativeElement.querySelector("#editor"), config)
                .then(editor => {
                    if (this.destroyed) {
                        editor.destroy();
                        return;
                    }
                    this.instance = editor;
                    editor.isReadOnly = this.readonly;
                    this.loading = false;
                    const toolbarContainer = this.ref.nativeElement.querySelector("#toolbar-container");
                    toolbarContainer.appendChild(editor.ui.view.toolbar.element);
                    if (this.value) {
                        editor.setData(this.value);
                    }
                    editor.model.document.on("change:data", () => {
                        this.valueChange.emit(editor.getData());
                    });
                    this.onReady.emit(editor);
                }).catch(error => {
                    if (this.destroyed) return;
                    this.loading = false;
                    this.editorError = true;
                    console.error(error);
                });
        });
    }

    ngOnDestroy() {
        this.destroyed = true;
        if (this.instance) {
            this.instance.destroy().catch(() => {});
            this.instance = null;
        }
    }

}
