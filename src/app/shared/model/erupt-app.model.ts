export interface EruptAppModel {
    verifyCodeCount: number;
    pwdTransferEncrypt: boolean;
    locales: string[];
    hash: number;
    version: string;
    loginPagePath: string;
    waterMark: boolean;
    waterMarkDate: boolean;  // whether the watermark displays the date
    waterMarkContent: string;  // custom watermark content
    resetPwd: boolean;
    mfa: { enable: boolean; issuer: string; window: number };
    resetPwdPrompt: boolean;  // whether to prompt users who haven't changed the default password
    fileDomain?: string;  // attachment host from the backend AttachmentProxy; null when erupt serves attachments itself
    // site settings patch laid over window.eruptSiteConfig (WindowModel.applySite)
    site?: { [key: string]: any };
    properties: object;
}

let eruptAppConfig: EruptAppModel = window["eruptApp"] || {};

export class EruptAppData {

    static get() {
        return eruptAppConfig;
    }

    static put(value: EruptAppModel) {
        eruptAppConfig = value;
    }

}
