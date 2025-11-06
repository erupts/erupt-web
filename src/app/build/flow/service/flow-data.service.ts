import {Injectable} from '@angular/core';
import {FlowApiService} from "@flow/service/flow-api.service";
import {FlexNodeModel} from "@flow/model/flex-node.model";

@Injectable()
export class FlowDataService {

    flexNodes: FlexNodeModel[] = [];

    constructor(flowApiService: FlowApiService) {
        flowApiService.flexNodes().subscribe(res => {
            this.flexNodes = res.data;
        })
    }
}
