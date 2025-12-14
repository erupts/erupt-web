import {VL} from "../../build/erupt/model/erupt-field.model";

export interface LoginModel {
    token: string;
    expire: string;
    useVerifyCode: boolean;
    pass: boolean;
    reason: string;
}

export interface Userinfo {
    avatar: string;
    nickname: string;
    indexMenuType: string;
    indexMenuValue: string;
    resetPwd: boolean;
    tenantId: string;
    tenantName: string;
}

export interface NoticeChannel extends VL {

}

export interface NoticeScene {
    code: string
    name: string
}

export interface NoticeMessageDetail {
    noticeLog: NoticeMessage;
    status: NoticeStatus;
    channel: string;
}

export interface NoticeMessage {
    title: string;
    content: string;
    url: string;
    noticeScene: NoticeScene;
    createTime: string;
}

export interface Announcement {
    id: number;
    title: string;
    content: string;
    status: AnnouncementStatus;
    createTime: string;
}

export enum AnnouncementStatus {
    OPEN = "OPEN",
    CLOSE = "CLOSE"
}

export enum NoticeStatus {
    SENT = "SENT",
    UNREAD = "UNREAD",
    READ = "READ"
}
