import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {DataService} from '@shared/service/data.service';
import {Announcement, NoticeMessageDetail, NoticeScene, NoticeStatus} from '@shared/model/user.model';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NzDrawerRef, NzDrawerService} from 'ng-zorro-antd/drawer';
import {NzModalService} from "ng-zorro-antd/modal";
import {NoticeDetailComponent} from "../notice-detail/notice-detail.component";
import {I18NService} from "@core";
import {AnnouncementDetailComponent} from "../announcement-detail/announcement-detail.component";
import {EruptIframeComponent} from "@shared/component/iframe.component";

// export enum for use in templates
export {NoticeStatus};

@Component({
    standalone: false,
    selector: 'erupt-notice',
    templateUrl: './notice.component.html',
    styleUrls: ['./notice.component.less']
})
export class NoticeComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    channelOptions: any[] = [];
    selectedChannelIndex: number = 0;

    notices: NoticeMessageDetail[] = [];
    announcements: Announcement[] = [];

    loadingMessages = false;
    pageIndex = 1;
    pageSize = 10;
    total = 0;
    searchKeyword: string = ''; // search keyword
    onlyUnread: boolean = true; // show only unread

    scene: number;
    scenes: NoticeScene[] = [];

    constructor(
        private dataService: DataService,
        private drawerRef: NzDrawerRef,
        private i18nService: I18NService,
        private cdr: ChangeDetectorRef,
        @Inject(NzModalService) private modal: NzModalService,
        private drawerService: NzDrawerService
    ) {
    }

    ngOnInit(): void {
        this.channelOptions = [{
            label: this.i18nService.fanyi('notice'),
            value: 0
        }, {
            label: this.i18nService.fanyi('notice.announcement'),
            value: 1
        }]
        this.selectedChannelIndex = 0;
        this.dataService.noticeScenes().subscribe(res => {
            this.scenes = res.data;
        });
        this.loadMessages();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // select channel (by index)
    onChannelChange(index: number): void {
        this.selectedChannelIndex = index;
        this.pageIndex = 1;
        this.searchKeyword = ''; // clear search when switching channels
        this.loadMessages();
    }

    // search
    onSearch(keyword: string): void {
        this.searchKeyword = keyword;
        this.pageIndex = 1; // reset to first page when searching
        this.loadMessages();
    }

    onOnlyUnreadChange(onlyUnread: boolean): void {
        this.onlyUnread = onlyUnread;
        this.pageIndex = 1;
        this.loadMessages();
    }

    onSceneChange(scene: number): void {
        this.scene = scene;
        this.pageIndex = 1;
        this.loadMessages();
    }

    // load message list
    loadMessages(): void {
        this.loadingMessages = true;
        if (this.selectedChannelIndex === 0) {
            // load notice messages
            this.dataService.noticeMessages(this.pageIndex, this.pageSize, this.searchKeyword || null, this.onlyUnread ? NoticeStatus.UNREAD : null, this.scene)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (result) => {
                        this.notices = result.data.list;
                        this.total = result.data.total;
                    },
                    error: () => {
                        this.notices = [];
                        this.total = 0;
                    },
                    complete: () => {
                        this.loadingMessages = false;
                        this.cdr.detectChanges();
                    }
                });
        } else if (this.selectedChannelIndex === 1) {
            // load announcements
            this.dataService.announcement(this.pageIndex, this.pageSize, this.searchKeyword || null)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (res) => {
                        this.announcements = res.data.list;
                        this.total = res.data.total;
                    },
                    error: () => {
                        this.announcements = [];
                        this.total = 0;
                    },
                    complete: () => {
                        this.loadingMessages = false;
                        this.cdr.detectChanges();
                    }
                });
        }
    }

    // pagination change
    onPageIndexChange(pageIndex: number): void {
        this.pageIndex = pageIndex;
        this.loadMessages();
    }

    // view message detail
    viewMessageDetail(message: NoticeMessageDetail): void {
        message.status = NoticeStatus.READ;
        const messageId = (message as any).id || (message.noticeLog as any)?.id;
        let ref = this.modal.create({
            nzDraggable: true,
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
            nzDraggable: true,
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

    // close drawer
    close(): void {
        this.drawerRef.close();
    }

    // open URL link
    openUrl(url: string, title: string): void {
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

    // mark all as read
    markAllAsRead(): void {
        this.modal.confirm({
            nzTitle: this.i18nService.fanyi('notice.confirm.title'),
            nzContent: this.i18nService.fanyi('notice.confirm.readAll'),
            nzOnOk: () => {
                return new Promise((resolve, reject) => {
                    this.dataService.noticeReadAllCount()
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                // mark all unread messages on the current page as read
                                this.notices.forEach((msg: NoticeMessageDetail) => {
                                    msg.status = NoticeStatus.READ;
                                });
                                this.cdr.detectChanges();
                                resolve(true);
                            },
                            error: (err) => {
                                reject(err);
                            }
                        });
                });
            }
        });
    }

    protected readonly NoticeStatus = NoticeStatus;
}
