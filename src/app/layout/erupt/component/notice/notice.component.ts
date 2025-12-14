import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {DataService} from '@shared/service/data.service';
import {Announcement, NoticeChannel, NoticeMessageDetail, NoticeStatus} from '@shared/model/user.model';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NzDrawerRef, NzDrawerService} from 'ng-zorro-antd/drawer';
import {NzModalService} from "ng-zorro-antd/modal";
import {NoticeDetailComponent} from "../notice-detail/notice-detail.component";
import {I18NService} from "@core";
import {AnnouncementDetailComponent} from "../announcement-detail/announcement-detail.component";
import {EruptIframeComponent} from "@shared/component/iframe.component";

// 导出枚举以便在模板中使用
export {NoticeStatus};

@Component({
    selector: 'erupt-notice',
    templateUrl: './notice.component.html',
    styleUrls: ['./notice.component.less']
})
export class NoticeComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    channels: NoticeChannel[] = [];
    channelOptions: string[] = [];
    selectedChannelIndex: number = 0;

    messages: any[] = []; // 复用 messages 对象，可以存储 NoticeMessageDetail 或 Announcement

    loadingMessages = false;
    pageIndex = 1;
    pageSize = 10;
    total = 0;

    constructor(
        private dataService: DataService,
        private drawerRef: NzDrawerRef,
        private i18nService: I18NService,
        @Inject(NzModalService) private modal: NzModalService,
        private drawerService: NzDrawerService
    ) {
    }

    ngOnInit(): void {
        this.channelOptions = [
            this.i18nService.fanyi('notice'),
            this.i18nService.fanyi('notice.announcement')
        ]
        this.selectedChannelIndex = 0;
        this.loadMessages();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // 加载渠道列表
    // loadChannels(): void {
    //     this.dataService.noticeChannels()
    //         .pipe(takeUntil(this.destroy$))
    //         .subscribe({
    //             next: (channels) => {
    //                 this.channels = channels.data;
    //                 this.channelOptions = channels.data.map(c => c.label);
    //                 if (channels.data.length > 0) {
    //                     this.selectedChannelIndex = 0;
    //                     this.loadMessages();
    //                 }
    //             },
    //             error: () => {
    //             }
    //         });
    // }

    // 选择渠道（通过索引）
    onChannelChange(index: number): void {
        this.selectedChannelIndex = index;
        this.pageIndex = 1;
        this.loadMessages();
    }

    // 加载消息列表
    loadMessages(): void {
        this.loadingMessages = true;

        if (this.selectedChannelIndex === 0) {
            // 加载通知消息
            this.dataService.noticeMessages(this.pageIndex, this.pageSize)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (result) => {
                        this.messages = result.data.list;
                        this.total = result.data.total;
                        this.loadingMessages = false;
                    },
                    error: () => {
                        this.messages = [];
                        this.total = 0;
                        this.loadingMessages = false;
                    }
                });
        } else if (this.selectedChannelIndex === 1) {
            // 加载公告
            this.dataService.announcement(this.pageIndex, this.pageSize)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (res) => {
                        this.messages = res.data.list;
                        this.total = res.data.total;
                        this.loadingMessages = false;
                    },
                    error: () => {
                        this.messages = [];
                        this.total = 0;
                        this.loadingMessages = false;
                    }
                });
        }
    }

    // 分页变化
    onPageIndexChange(pageIndex: number): void {
        this.pageIndex = pageIndex;
        this.loadMessages();
    }

    // 查看消息详情
    viewMessageDetail(message: NoticeMessageDetail): void {
        message.status = NoticeStatus.READ;
        const messageId = (message as any).id || (message.noticeLog as any)?.id;
        let ref = this.modal.create({
            nzTitle: message.noticeLog?.title,
            nzBodyStyle: {
                padding: '0'
            },
            nzFooter: null,
            nzContent: NoticeDetailComponent,
        });
        ref.componentInstance.messageId = messageId;
    }

    viewAnnouncementDetail(announcement: Announcement): void {
        let ref = this.modal.create({
            nzWrapClassName: "modal-lg",
            nzTitle: announcement.title,
            nzBodyStyle: {
                padding: '0'
            },
            nzFooter: null,
            nzContent: AnnouncementDetailComponent,
        });
        ref.componentInstance.announcement = announcement;
    }

    // 关闭抽屉
    close(): void {
        this.drawerRef.close();
    }

    // 打开 URL 链接
    openUrlDrawer(url: string, title: string): void {
        this.drawerService.create({
            nzTitle: title,
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

    protected readonly NoticeStatus = NoticeStatus;
}
