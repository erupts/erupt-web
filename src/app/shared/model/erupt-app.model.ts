export interface EruptAppModel {
    verifyCodeCount: number;
    pwdTransferEncrypt: boolean;
    locales: string[];
    hash: number;
    version: string;
    loginPagePath: string;
    waterMark: boolean;
    resetPwd: boolean;
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
