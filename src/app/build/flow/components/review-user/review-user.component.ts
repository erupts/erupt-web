import {Component, Inject, Input, OnInit} from '@angular/core';
import {ReviewMode, ReviewModeValue} from "@flow/model/flow-approval.model";
import {KV} from "../../../erupt/model/util.model";
import {UpmsDataService} from "@flow/service/upms-data.service";
import {FlowPermission} from "@flow/model/flow.model";
import {UpmsSelectComponent} from "@flow/components/upms-select/upms-select.component";
import {NzModalService} from "ng-zorro-antd/modal";

@Component({
    standalone: false,
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

    constructor(private upmsDataService: UpmsDataService, @Inject(NzModalService) private modal: NzModalService,) {

    }

    ngOnInit(): void {
        this.users = this.upmsDataService.upmsData.users;
        this.posts = this.upmsDataService.upmsData.posts;
        this.roles = this.upmsDataService.upmsData.roles;
    }

    changeReview() {
        this.reviewUserMode.modeValue = null;
    }

    changeViewScope() {
        let ref = this.modal.create({
            nzTitle: '请选择可见范围',
            nzWidth: '880px',
            nzDraggable: true,
            nzStyle: {top: '30px'},
            nzBodyStyle: {padding: '0'},
            nzContent: UpmsSelectComponent,
        })
        ref.getContentComponent().flowUpmsScopes = this.reviewUserMode.modeValue || [];
        ref.getContentComponent().flowUpmsScopesChange.subscribe(scopes => {
            this.reviewUserMode.modeValue = scopes;
        });
    }

    protected readonly FlowPermission = FlowPermission;
}
