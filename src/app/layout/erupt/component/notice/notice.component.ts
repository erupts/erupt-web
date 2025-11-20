import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {DataService} from '@shared/service/data.service';
import {NoticeChannel, NoticeMessageDetail, NoticeStatus} from '@shared/model/user.model';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NzDrawerRef} from 'ng-zorro-antd/drawer';
import {NzModalService} from "ng-zorro-antd/modal";

// 导出枚举以便在模板中使用
export {NoticeStatus};

@Component({
    selector: 'erupt-notice',
    templateUrl: './notice.component.html',
    styleUrls: ['./notice.component.less']
})
export class NoticeComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // 渠道相关
    channels: NoticeChannel[] = [];
    channelOptions: string[] = [];
    selectedChannel: string = '';
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
                    this.channels = channels;
                    this.channelOptions = channels.map(c => c.label);
                    if (channels.length > 0) {
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
                    // 如果返回的是数组，直接使用
                    if (Array.isArray(result)) {
                        this.messages = result;
                        this.total = result.length;
                    }
                    // 如果返回的是分页对象
                    else if (result && typeof result === 'object' && 'list' in result) {
                        this.messages = (result as any).list || [];
                        this.total = (result as any).total || 0;
                    }
                    // 其他情况
                    else {
                        this.messages = [];
                        this.total = 0;
                    }
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
        // 尝试从消息中获取 id（可能在 noticeLog 或其他字段中）
        const messageId = (message as any).id || (message.noticeLog as any)?.id;
        this.modal.create({
            nzTitle: message.noticeLog?.title,
            nzFooter: null,
            nzBodyStyle: {height: '55vh', scrollY: 'auto'},
            nzContent: message.noticeLog?.content || ''
        });
    }

    // 关闭抽屉
    close(): void {
        this.drawerRef.close();
    }

    // 检查是否为未读状态
    isUnread(status: NoticeStatus | string): boolean {
        return status === NoticeStatus.UNREAD || status === 'UNREAD';
    }
}
