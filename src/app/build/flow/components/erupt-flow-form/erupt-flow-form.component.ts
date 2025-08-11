import {Component, Input, OnInit} from '@angular/core';
import {FlowApiService} from "@flow/service/flow-api.service";
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FormSize} from "../../../erupt/model/erupt.enum";

@Component({
    selector: 'erupt-flow-form',
    templateUrl: './erupt-flow-form.component.html',
    styleUrls: ['./erupt-flow-form.component.less']
})
export class EruptFlowFormComponent implements OnInit {

    loading: boolean = false;

    @Input() erupt: string;

    @Input() readonly: boolean;

    @Input() eruptBuild: EruptBuildModel;

    constructor(private flowApiService: FlowApiService) {

    }

    ngOnInit(): void {
        this.loading = true;
        if (this.erupt) {
            this.flowApiService.eruptFlowBuild(this.erupt).subscribe(res => {
                this.eruptBuild = res.data;
                this.eruptBuild.eruptModel.eruptJson.layout.formSize = FormSize.FULL_LINE;
            })
        }
    }
}
