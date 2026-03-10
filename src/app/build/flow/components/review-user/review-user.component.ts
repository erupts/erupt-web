import {Component, Inject, Input, OnInit} from '@angular/core';
import {ReviewMode, ReviewModeValue} from "@flow/model/flow-approval.model";
import {KV} from "../../../erupt/model/util.model";
import {UpmsDataService} from "@flow/service/upms-data.service";
import {NzModalService} from "ng-zorro-antd/modal";
import {NodeRule, NodeType} from "@flow/model/node.model";

@Component({
    standalone: false,
    selector: 'app-review-user',
    templateUrl: './review-user.component.html',
    styleUrls: ['./review-user.component.less']
})
export class ReviewUserComponent implements OnInit {

    protected readonly ApprovalMode = ReviewMode;

    @Input() reviewUserMode: ReviewModeValue;

    @Input() flowRule: NodeRule[];
    @Input() nodeId: string;

    users: KV<number, string>[] = [];

    posts: KV<number, string>[] = [];

    roles: KV<number, string>[] = [];

    constructor(private upmsDataService: UpmsDataService, @Inject(NzModalService) private modal: NzModalService) {

    }

    ngOnInit(): void {
        this.users = this.upmsDataService.upmsData.users;
        this.posts = this.upmsDataService.upmsData.posts;
        this.roles = this.upmsDataService.upmsData.roles;
    }

    get assignedNodes(): KV<string, string>[] {
        let nodes: KV<string, string>[] = [];
        this.getAssignedNodes(this.flowRule, nodes);
        return nodes;
    }

    private getAssignedNodes(rules: NodeRule[], nodes: KV<string, string>[]): boolean {
        if (!rules) return false;
        for (let rule of rules) {
            if (rule.id == this.nodeId) {
                return true;
            }
            if ([NodeType.APPROVAL, NodeType.CC, NodeType.ASSIGNEE].includes(rule.type)) {
                nodes.push({key: rule.id, value: rule.name});
            }
            if (rule.branches) {
                if (this.getAssignedNodes(rule.branches, nodes)) {
                    return true;
                }
            }
        }
        return false;
    }

    changeReview() {
        if (this.reviewUserMode.mode == ReviewMode.SELF_SELECT) {
            this.reviewUserMode.modeValue = [];
        } else {
            this.reviewUserMode.modeValue = null;
        }
    }

}
