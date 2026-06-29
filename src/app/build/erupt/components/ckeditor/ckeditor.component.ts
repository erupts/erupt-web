import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges
} from "@angular/core";
import {LazyService} from "@delon/util";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EruptModel} from "../../model/erupt.model";
import {RestPath} from "../../model/erupt.enum";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

/**
 * CKEditor 5 function plugin that turns `<span data-variable="true" ...>` markup into a
 * first-class inline-object element ("printVar"). This is required because this prebuilt
 * editor bundle ships without GeneralHtmlSupport: any unknown span attributes (data-id,
 * style, contenteditable) would otherwise be stripped by the schema, breaking the
 * display-label / store-token round-trip used by the print template editor.
 *
 * - upcast:          span[data-variable] -> model element (carries code/label/color)
 * - editingDowncast: model element -> atomic inline widget chip shown inside the editor
 * - dataDowncast:    model element -> span[data-variable][data-id] in getData() output,
 *                    which the print-template component then maps back to the `$!{code}`
 *                    Velocity token for storage.
 *
 * The plugin is inert for editors that never contain `data-variable` spans.
 */
export function PrintVarPlugin(editor: any): void {
    // This prebuilt CKEditor 5 bundle (DecoupledDocumentEditor, © 2020) passes the
    // conversion writer as the 2nd callback argument directly; modern CKEditor 5 wraps
    // it as {writer}. Destructuring {writer} yields undefined here, which throws on
    // createElement/createContainerElement and silently breaks both loading saved
    // templates and inserting variables. Resolve the writer for either signature.
    const w = (api: any) => (api && api.writer) ? api.writer : api;

    editor.model.schema.register('printVar', {
        allowWhere: '$text',
        isInline: true,
        isObject: true,
        allowAttributes: ['code', 'label', 'color']
    });

    editor.conversion.for('upcast').elementToElement({
        view: {name: 'span', attributes: {'data-variable': 'true'}},
        model: (viewEl: any, api: any) => w(api).createElement('printVar', {
            code: viewEl.getAttribute('data-id') || '',
            label: viewEl.getAttribute('data-label') || viewEl.getAttribute('data-id') || '',
            color: viewEl.getAttribute('data-color') || ''
        })
    });

    // Inside the editor: render an atomic, selectable/deletable inline widget.
    // The chip MUST be a widget (the 'widget' custom property + 'ck-widget' class) — a
    // plain UIElement renders fine but is not real content, so the caret can't land on
    // it and Backspace/selection never target it (it becomes impossible to delete). The
    // Widget plugin shipped in this bundle then handles click-to-select and delete.
    // A single text child keeps the widget atomic; nested inline spans re-introduce
    // editable positions and break deletion. Styling is inline because Angular
    // view-encapsulated .less cannot reach CKEditor-generated DOM.
    editor.conversion.for('editingDowncast').elementToElement({
        model: 'printVar',
        view: (modelEl: any, api: any) => {
            const writer = w(api);
            const code = modelEl.getAttribute('code') || '';
            const label = modelEl.getAttribute('label') || code;
            const color = modelEl.getAttribute('color') || '#1890ff';
            const span = writer.createContainerElement('span', {
                class: 'erupt-print-var ck-widget',
                'data-id': code,
                contenteditable: 'false',
                style: `color:${color};margin:0 2px;font-weight:bold;`
            });
            writer.insert(writer.createPositionAt(span, 0), writer.createText('{ ' + label + ' }'));
            writer.setCustomProperty('widget', true, span);
            return span;
        }
    });

    // In getData() output: a normal span carrying data-variable/data-id, which the
    // print-template hijack converts to the `$!{code}` token before persisting.
    editor.conversion.for('dataDowncast').elementToElement({
        model: 'printVar',
        view: (modelEl: any, api: any) => {
            const writer = w(api);
            const code = modelEl.getAttribute('code') || '';
            const label = modelEl.getAttribute('label') || code;
            const color = modelEl.getAttribute('color') || '';
            const span = writer.createContainerElement('span', {
                class: 'erupt-print-var',
                'data-variable': 'true',
                'data-id': code,
                'data-label': label,
                'data-color': color,
                contenteditable: 'false'
            });
            writer.insert(writer.createPositionAt(span, 0), writer.createText('{ ' + label + ' }'));
            return span;
        }
    });
}

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
                language: "zh-cn",
                // Enables print-template variable chips (display label, store $!{code}).
                // Inert when content contains no data-variable spans.
                extraPlugins: [PrintVarPlugin]
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
