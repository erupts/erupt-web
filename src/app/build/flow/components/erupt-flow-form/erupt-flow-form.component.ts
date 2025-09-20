import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../../erupt/service/data-handler.service";
import {FlowApiService} from "@flow/service/flow-api.service";
import {FormSize} from "../../../erupt/model/erupt.enum";

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
    }

    initEruptValue() {
        this.dataService.getInitValue(this.eruptBuild.eruptModel.eruptName).subscribe(data => {
            this.dataHandlerService.objectToEruptValue(data, this.eruptBuild);
        })
    }

}
