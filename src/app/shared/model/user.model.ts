import {VL} from "../../build/erupt/model/erupt-field.model";

export interface LoginModel {
    token: string;
    account: string;
    expire: string;
    useVerifyCode: boolean;
    pass: boolean;
    reason: string;
    mfaRequired: boolean;
    mfaTicket: string;
}

//one sign-on button on the login page, everything else about the provider stays server side
export interface SsoProvider {
    code: string;
    name: string;
    icon: string;
}

export interface MfaStatus {
    enable: boolean;
    bound: boolean;
    recoveryCodeCount: number;
}

export interface MfaEnroll {
    uri: string;
    secret: string;
}

export interface Userinfo {
    account: string;
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
    id: number
    code: string
    name: string
}

export interface NoticeMessageDetail {
    // one recipient's copy of a notice; the detail endpoint is keyed by this id
    id: number;
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
