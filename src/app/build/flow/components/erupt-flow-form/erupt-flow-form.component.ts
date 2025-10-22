import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../../erupt/service/data-handler.service";
import {FlowApiService} from "@flow/service/flow-api.service";
import {FormSize} from "../../../erupt/model/erupt.enum";
import {FormAccessEnum} from "@flow/model/flow.model";

@Component({
    selector: 'erupt-flow-form',
    templateUrl: './erupt-flow-form.component.html',
    styleUrls: ['./erupt-flow-form.component.less']
})
export class EruptFlowFormComponent implements OnInit {

    loading: boolean = false;

    @Input() readonly: boolean;

    @Input() eruptBuild: EruptBuildModel;

    @Input() erupt: string;

    @Input() initValue: boolean = true;

    @Input() formAccesses: Record<string, FormAccessEnum>;

    constructor(private dataService: DataService,
                private flowApiService: FlowApiService,
                private dataHandlerService: DataHandlerService) {

    }

    ngOnInit(): void {
        this.loading = true;
        if (this.erupt) {
            this.flowApiService.eruptFlowBuild(this.erupt).subscribe({
                next: res => {
                    res.data.eruptModel.eruptJson.layout.formSize = FormSize.FULL_LINE;
                    this.dataHandlerService.initErupt(res.data)
                    this.eruptBuild = res.data;
                    this.initEruptValue();
                },
                complete: () => {
                    this.loading = false;
                }
            })
        } else {
            if (this.initValue) {
                this.initEruptValue();
            }
        }
        if (this.formAccesses) {
            if (this.eruptBuild) {
                for (let eruptFieldModel of this.eruptBuild.eruptModel.eruptFieldModels) {
                    let access: FormAccessEnum = this.formAccesses[eruptFieldModel.fieldName];
                    if (access) {
                        switch (access) {
                            case FormAccessEnum.READONLY:
                                eruptFieldModel.eruptFieldJson.edit.readOnly = {
                                    add: true,
                                    edit: true,
                                };
                                break;
                            case FormAccessEnum.READ_WRITE:
                                eruptFieldModel.eruptFieldJson.edit.readOnly = {
                                    add: false,
                                    edit: false,
                                };
                                break;
                            case FormAccessEnum.HIDE:
                                eruptFieldModel.eruptFieldJson.edit.show = false;
                                break;
                            case FormAccessEnum.NOT_NULL:
                                eruptFieldModel.eruptFieldJson.edit.notNull = true;
                                break;
                        }
                    } else {
                        eruptFieldModel.eruptFieldJson.edit.readOnly = {
                            add: true,
                            edit: true,
                        };
                    }
                }
            }
        }
    }

    initEruptValue() {
        this.dataService.getInitValue(this.eruptBuild.eruptModel.eruptName).subscribe(data => {
            this.dataHandlerService.objectToEruptValue(data, this.eruptBuild);
        })
    }

}
