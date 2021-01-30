export interface LoginModel {
    token: string;
    expire: string;
    useVerifyCode: boolean;
    pass: boolean;
    reason: string;
    userName: string;
    indexPath?: string;
    indexMenu?: string
}
