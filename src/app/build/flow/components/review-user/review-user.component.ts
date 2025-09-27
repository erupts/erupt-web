import {Component, Input, OnInit} from '@angular/core';
import {ReviewMode, ReviewModeValue} from "@flow/model/fllw-approval.model";
import {KV} from "../../../erupt/model/util.model";
import {UpmsDataService} from "@flow/service/upms-data.service";

@Component({
    selector: 'app-review-user',
    templateUrl: './review-user.component.html',
    styleUrls: ['./review-user.component.less']
})
export class ReviewUserComponent implements OnInit {

    protected readonly ApprovalMode = ReviewMode;

    @Input() reviewUserMode: ReviewModeValue;

    users: KV<number, string>[] = [];

    posts: KV<number, string>[] = [];

    roles: KV<number, string>[] = [];

    deptHeads: KV<number, string>[] = [];

    constructor(private upmsDataService: UpmsDataService) {

    }

    ngOnInit(): void {
        this.users = this.upmsDataService.users;
        this.posts = this.upmsDataService.posts;
        this.roles = this.upmsDataService.roles;
        for (let i = 0; i <= 10; i++) {
            this.deptHeads.push({key: i, value: "直属组织负责人" + (i == 0 ? "" : `加 ${i} 级负责人`)})
        }
    }

    changeReview() {
        this.reviewUserMode.modeValue = null;
    }

}
