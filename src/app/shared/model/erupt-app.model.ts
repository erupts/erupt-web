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
