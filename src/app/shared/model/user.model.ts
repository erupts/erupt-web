export interface LoginModel {
    token: string;
    expire: string;
    useVerifyCode: boolean;
    pass: boolean;
    reason: string;
}

export interface Userinfo {
    nickname: string;
    indexMenuType: string;
    indexMenuValue: string;
    resetPwd: boolean;
    tenantId: string;
    tenantName: string;
}
