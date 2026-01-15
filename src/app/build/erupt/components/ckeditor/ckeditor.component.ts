import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output
} from "@angular/core";
import {LazyService} from "@delon/util";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EruptModel} from "../../model/erupt.model";
import {RestPath} from "../../model/erupt.enum";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

declare const CKEDITOR: any;

@Component({
    standalone: false,
    selector: "ckeditor",
    templateUrl: "./ckeditor.component.html",
    styles: []
})
export class CkeditorComponent implements AfterViewInit,OnDestroy {

    @Input() eruptField: EruptFieldModel;

    @Input() erupt: EruptModel;

    @Input() value;

    @Input() readonly: boolean;

    @Output() valueChange = new EventEmitter();

    public loading: boolean = true;

    editorError: boolean = false;

    private editorInstance: any;

    constructor(private lazy: LazyService, private ref: ElementRef,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    ngAfterViewInit() {
        let that = this;
        this.lazy.loadScript("assets/ckeditor4/ckeditor.js").then(() => {
            this.editorInstance = CKEDITOR.replace(this.ref.nativeElement.querySelector("#editor"), {
                language: "zh-cn",
                filebrowserUploadUrl: RestPath.file + "/upload-html-editor/" + this.erupt.eruptName + "/" +
                    this.eruptField.fieldName + "?_erupt=" + this.erupt.eruptName + "&_token=" + this.tokenService.get().token,
                readOnly: this.readonly
            });

            this.editorInstance.on('instanceReady', function () {
                that.loading = false;
                if (that.value) {
                    this.editorInstance.setData(that.value);
                }
            });

            this.editorInstance.on('change', function () {
                that.valueChange.emit(this.editorInstance.getData());
            });
        }).catch(error => {
            this.loading = false;
            this.editorError = true;
            console.error(error);
        });
    }

    ngOnDestroy() {
        console.log('CKEditor component destroyed');
        if (this.editorInstance) {
            this.editorInstance.destroy(true);
            this.editorInstance = null;
        }
    }

}
