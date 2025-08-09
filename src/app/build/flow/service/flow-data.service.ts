import {Injectable} from '@angular/core';
import {FlowApiService} from "@flow/service/flow-api.service";
import {FlexNode} from "@flow/model/flexNode";

@Injectable({
    providedIn: 'root'
})
export class FlowDataService {

    flexNodes: FlexNode[] = [];

    constructor(flowApiService: FlowApiService) {
        flowApiService.flexNodes().subscribe(res => {
            this.flexNodes = res.data;
        })
    }
}
