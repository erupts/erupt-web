import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";

@Component({
    selector: 'erupt-flow-form',
    templateUrl: './erupt-flow-form.component.html',
    styleUrls: ['./erupt-flow-form.component.less']
})
export class EruptFlowFormComponent implements OnInit {

    loading: boolean = false;

    @Input() readonly: boolean;

    @Input() eruptBuild: EruptBuildModel;

    constructor() {

    }

    ngOnInit(): void {

    }
}
