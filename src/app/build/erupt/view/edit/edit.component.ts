import {Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {EditType, Scene} from "../../model/erupt.enum";
import {SettingsService} from "@delon/theme";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataHandlerService} from "../../service/data-handler.service";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {EditTypeComponent} from "../../components/edit-type/edit-type.component";
import {DataService} from "@shared/service/data.service";

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

    @ViewChild("eruptEdit", {static: false}) eruptEdit: EditTypeComponent;

    eruptFieldModelMap: Map<String, EruptFieldModel>;

    constructor(
        @Inject(NzMessageService)
        private msg: NzMessageService,
        @Inject(NzModalService)
        private modal: NzModalService,
        private dataService: DataService,
        private settingSrv: SettingsService,
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
        let ro = eruptFieldModel.eruptFieldJson.edit.readOnly;
        if (this.behavior === Scene.ADD) {
            return ro.add;
        } else {
            return ro.edit;
        }
    }

    beforeSaveValidate(): boolean {
        if (this.loading) {
            this.msg.warning("数据加载中无法保存!");
            return false;
        } else if (!this.eruptEdit.eruptEditValidate()) {
            return false;
        } else {
            return true;
        }
    }

    ngOnDestroy(): void {
    }


}
