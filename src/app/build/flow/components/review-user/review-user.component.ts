import {Component, Input, OnInit} from '@angular/core';
import {ReviewMode, ReviewModeValue} from "@flow/model/fllw-approval.model";
import {FlowUpmsApiService} from "@flow/service/flow-upms-api.service";
import {KV} from "../../../erupt/model/util.model";

@Component({
    selector: 'app-review-user',
    templateUrl: './review-user.component.html',
    styleUrls: ['./review-user.component.less']
})
export class ReviewUserComponent implements OnInit {

    protected readonly ApprovalMode = ReviewMode;

    @Input() reviewUserMode: ReviewModeValue;

    users: KV<number, string>[] = [];

    orgs: KV<number, string>[] = [];

    posts: KV<number, string>[] = [];

    roles: KV<number, string>[] = [];

    constructor(private flowUpmsApiService: FlowUpmsApiService) {

    }

    ngOnInit(): void {
        this.flowUpmsApiService.users().subscribe(res => {
            this.users = res.data;
        });
        // flowUpmsApiService.orgs().subscribe(res => {
        //     this.orgs = res.data;
        // });
        this.flowUpmsApiService.posts().subscribe(res => {
            this.posts = res.data;
        });
        this.flowUpmsApiService.roles().subscribe(res => {
            this.roles = res.data;
        });
    }

}
