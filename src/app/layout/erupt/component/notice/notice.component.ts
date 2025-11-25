import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {DataService} from '@shared/service/data.service';
import {NoticeChannel, NoticeMessageDetail, NoticeStatus} from '@shared/model/user.model';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NzDrawerRef} from 'ng-zorro-antd/drawer';
import {NzModalService} from "ng-zorro-antd/modal";
import {NoticeDetailComponent} from "../notice-detail/notice-detail.component";

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

    messages: NoticeMessageDetail[] = [];
    loadingMessages = false;
    pageIndex = 1;
    pageSize = 10;
    total = 0;

    constructor(
        private dataService: DataService,
        private drawerRef: NzDrawerRef,
        @Inject(NzModalService) private modal: NzModalService
    ) {
    }

    ngOnInit(): void {
        this.loadChannels();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // 加载渠道列表
    loadChannels(): void {
        this.dataService.noticeChannels()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (channels) => {
                    this.channels = channels.data;
                    this.channelOptions = channels.data.map(c => c.label);
                    if (channels.data.length > 0) {
                        this.selectedChannelIndex = 0;
                        this.loadMessages();
                    }
                },
                error: () => {
                }
            });
    }

    // 选择渠道（通过索引）
    onChannelChange(index: number): void {
        if (index >= 0 && index < this.channels.length) {
            this.selectedChannelIndex = index;
            this.pageIndex = 1;
            this.loadMessages();
        }
    }

    // 加载消息列表
    loadMessages(): void {
        this.loadingMessages = true;
        this.dataService.noticeMessages(this.channels[this.selectedChannelIndex].value, this.pageIndex, this.pageSize)
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

    // 关闭抽屉
    close(): void {
        this.drawerRef.close();
    }

    // 检查是否为未读状态
    isUnread(status: NoticeStatus | string): boolean {
        return status === NoticeStatus.UNREAD || status === 'UNREAD';
    }

    protected readonly NoticeStatus = NoticeStatus;
}
