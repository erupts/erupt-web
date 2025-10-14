import {Injectable} from '@angular/core';
import {KV} from "../../erupt/model/util.model";
import {FlowUpmsApiService} from "@flow/service/flow-upms-api.service";

@Injectable()
export class UpmsDataService {

    users: KV<number, string>[] = [];

    posts: KV<number, string>[] = [];

    roles: KV<number, string>[] = [];

    orgs: KV<number, string>[] = [];

    constructor(private flowUpmsApiService: FlowUpmsApiService) {
        this.flowUpmsApiService.users().subscribe(res => {
            this.users = res.data;
        });
        this.flowUpmsApiService.posts().subscribe(res => {
            this.posts = res.data;
        });
        this.flowUpmsApiService.roles().subscribe(res => {
            this.roles = res.data;
        });
        this.flowUpmsApiService.org().subscribe(res => {
            this.orgs = res.data;
        });
    }
}
