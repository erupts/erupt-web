import {Injectable} from '@angular/core';
import {FlowUpmsApiService} from "@flow/service/flow-upms-api.service";
import {UpmsData} from "../../erupt/model/upms.model";

@Injectable()
export class UpmsDataService {

    upmsData: UpmsData = new UpmsData();

    constructor(private flowUpmsApiService: FlowUpmsApiService) {
        this.flowUpmsApiService.users().subscribe(res => {
            this.upmsData.users = res.data;
        });
        this.flowUpmsApiService.posts().subscribe(res => {
            this.upmsData.posts = res.data;
        });
        this.flowUpmsApiService.roles().subscribe(res => {
            this.upmsData.roles = res.data;
        });
        this.flowUpmsApiService.org().subscribe(res => {
            this.upmsData.orgs = res.data;
        });
    }
}
