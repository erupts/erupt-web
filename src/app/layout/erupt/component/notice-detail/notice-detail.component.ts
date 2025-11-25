import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "@shared/service/data.service";
import {NoticeMessageDetail} from "@shared/model/user.model";

@Component({
    selector: 'app-notice-detail',
    templateUrl: './notice-detail.component.html',
    styleUrls: ['./notice-detail.component.less']
})
export class NoticeDetailComponent implements OnInit {

    @Input() messageId: number;

    noticeMessageDetail: NoticeMessageDetail;

    constructor(private dataService: DataService,) {
    }

    ngOnInit(): void {
        this.dataService.noticeMessageDetail(this.messageId)
            .subscribe({
                next: (result) => {
                    this.noticeMessageDetail = result.data;
                },
                error: () => {
                }
            });
    }


}
