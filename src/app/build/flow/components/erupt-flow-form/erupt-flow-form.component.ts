import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {DataHandlerService} from "../../../erupt/service/data-handler.service";

@Component({
    selector: 'erupt-flow-form',
    templateUrl: './erupt-flow-form.component.html',
    styleUrls: ['./erupt-flow-form.component.less']
})
export class EruptFlowFormComponent implements OnInit {

    loading: boolean = false;

    @Input() readonly: boolean;

    @Input() eruptBuild: EruptBuildModel;

    constructor(private dataService: DataService,
                private dataHandlerService: DataHandlerService) {

    }

    ngOnInit(): void {
        this.dataService.getInitValue(this.eruptBuild.eruptModel.eruptName).subscribe(data => {
            this.dataHandlerService.objectToEruptValue(data, this.eruptBuild);
        })
    }

}
