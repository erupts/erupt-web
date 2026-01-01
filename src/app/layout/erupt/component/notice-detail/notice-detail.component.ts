import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "@shared/service/data.service";
import {NoticeMessageDetail} from "@shared/model/user.model";
import {NzDrawerService} from 'ng-zorro-antd/drawer';
import {EruptIframeComponent} from "@shared/component/iframe.component";

@Component({
    standalone: false,
    selector: 'app-notice-detail',
    templateUrl: './notice-detail.component.html',
    styleUrls: ['./notice-detail.component.less']
})
export class NoticeDetailComponent implements OnInit {

    @Input() messageId: number;

    noticeMessageDetail: NoticeMessageDetail;

    constructor(
        private dataService: DataService,
        private drawerService: NzDrawerService
    ) {
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

    // 打开 URL 链接
    openUrlDrawer(url: string, title: string): void {
        this.drawerService.create({
            nzTitle: null,
            nzClosable: false,
            nzContent: EruptIframeComponent,
            nzContentParams: {
                url: url,
                height: "100%",
                width: '100%'
            },
            nzWidth: '45%',
            nzBodyStyle: {
                padding: 0
            },
            nzMaskClosable: true
        });
    }

}
