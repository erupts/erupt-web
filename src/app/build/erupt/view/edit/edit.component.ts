import {Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {EditType, Scene} from "../../model/erupt.enum";
import {ALAIN_I18N_TOKEN, SettingsService} from "@delon/theme";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataHandlerService} from "../../service/data-handler.service";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {EditTypeComponent} from "../../components/edit-type/edit-type.component";
import {DataService} from "@shared/service/data.service";
import {I18NService} from "@core";

@Component({
    selector: "erupt-edit",
    templateUrl: "./edit.component.html",
    styleUrls: ["./edit.component.less"]
})
export class EditComponent implements OnInit, OnDestroy {

    loading = false;

    editType = EditType;

    @Input() behavior: Scene = Scene.ADD;

    @Output() save = new EventEmitter();

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() id: any;

    @Input() readonly: boolean = false;

    @ViewChild("eruptEdit", {static: false}) eruptEdit: EditTypeComponent;

    eruptFieldModelMap: Map<String, EruptFieldModel>;

    constructor(
        @Inject(NzMessageService)
        private msg: NzMessageService,
        @Inject(NzModalService)
        private modal: NzModalService,
        private dataService: DataService,
        private settingSrv: SettingsService,
        @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
        private dataHandlerService: DataHandlerService) {

    }

    ngOnInit() {
        this.dataHandlerService.emptyEruptValue(this.eruptBuildModel);
        if (this.behavior == Scene.ADD) {
            this.loading = true;
            this.dataService.getInitValue(this.eruptBuildModel.eruptModel.eruptName).subscribe(data => {
                this.dataHandlerService.objectToEruptValue(data, this.eruptBuildModel);
                this.loading = false;
            });
        } else {
            this.loading = true;
            this.dataService.queryEruptDataById(this.eruptBuildModel.eruptModel.eruptName, this.id).subscribe(data => {
                this.dataHandlerService.objectToEruptValue(data, this.eruptBuildModel);
                this.loading = false;
            });
        }
        this.eruptFieldModelMap = this.eruptBuildModel.eruptModel.eruptFieldModelMap;
    }

    isReadonly(eruptFieldModel: EruptFieldModel) {
        if (this.readonly) {
            return true;
        }
        let ro = eruptFieldModel.eruptFieldJson.edit.readOnly;
        if (this.behavior === Scene.ADD) {
            return ro.add;
        } else {
            return ro.edit;
        }
    }

    beforeSaveValidate(): boolean {
        if (this.loading) {
            this.msg.warning(this.i18n.fanyi('global.update.loading..hint'));
            return false;
        } else return this.eruptEdit.eruptEditValidate();
    }

    ngOnDestroy(): void {
    }


}
