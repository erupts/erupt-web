import {AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {Router} from "@angular/router";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {CacheService} from "@delon/cache";
import {SettingsService} from "@delon/theme";
import {NzModalRef} from "ng-zorro-antd/modal";
import {DataService} from "@shared/service/data.service";
import {SocketService} from "@shared/service/socket.service";
import {PageAccountService} from "@shared/service/page-account.service";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {GlobalKeys} from "@shared/model/erupt-const";
import {WindowModel} from "@shared/model/window.model";
import {LoginModel} from "@shared/model/user.model";

export enum ReloginStep {
    PWD = "pwd",
    MFA = "mfa"
}

// Signs the same account back in over the page whose session expired, so nothing on it is lost;
// closes with the new token (ReloginService hands it to the held requests) or with nothing
@Component({
    standalone: false,
    selector: "erupt-relogin",
    templateUrl: "./relogin.component.html",
    styleUrls: ["./relogin.component.less"]
})
export class ReloginComponent implements OnInit, AfterViewInit, OnDestroy {

    readonly Step = ReloginStep;

    step = ReloginStep.PWD;

    readonly account: string;

    pwd = "";

    verifyCode = "";

    otp = "";

    useVerifyCode = false;

    verifyCodeUrl: string;

    private verifyCodeMark: number;

    private mfaTicket: string = null;

    // the code step also takes a single use recovery code
    recoveryMode = false;

    capsLock = false;

    loading = false;

    error = "";

    @ViewChild("input") input: ElementRef<HTMLInputElement>;

    // the token that expired: a different one showing up means another tab already signed in
    private readonly expiredToken: string;

    private readonly onStorage = () => {
        const model = this.tokenService.get();
        if (!model?.token || model.token === this.expiredToken) return;
        if (this.pageAccount.owns(model)) {
            this.modalRef.close(model.token);
        } else {
            // another account signed in: the held requests are this one's and fail; PageAccountService
            // already asks for a reload
            this.modalRef.close();
        }
    };

    constructor(public settings: SettingsService,
                private data: DataService,
                private modalRef: NzModalRef,
                private router: Router,
                private cacheService: CacheService,
                private socketService: SocketService,
                private pageAccount: PageAccountService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
        const token = tokenService.get();
        this.account = token?.["account"];
        this.expiredToken = token?.token;
    }

    ngOnInit(): void {
        if (EruptAppData.get().verifyCodeCount <= 0) {
            this.useVerifyCode = true;
            this.changeVerifyCode();
        }
        window.addEventListener("storage", this.onStorage);
    }

    ngAfterViewInit(): void {
        this.focus();
    }

    ngOnDestroy(): void {
        window.removeEventListener("storage", this.onStorage);
    }

    submit(): void {
        if (this.loading) return;
        this.error = "";
        this.step === ReloginStep.MFA ? this.submitMfa() : this.submitPwd();
    }

    private submitPwd(): void {
        if (!this.pwd) return;
        this.loading = true;
        const pwd = EruptAppData.get().pwdTransferEncrypt ? this.data.pwdEncode(this.pwd, 3) : this.pwd;
        this.data.login(this.account, pwd, this.verifyCode, this.verifyCodeMark).subscribe({
            next: (result: LoginModel) => {
                this.loading = false;
                if (result.mfaRequired) {
                    this.mfaTicket = result.mfaTicket;
                    this.step = ReloginStep.MFA;
                    this.otp = "";
                    this.focus();
                    return;
                }
                if (result.pass) {
                    this.renew(result.token);
                    return;
                }
                this.error = result.reason;
                this.pwd = "";
                this.verifyCode = "";
                this.useVerifyCode = result.useVerifyCode;
                if (result.useVerifyCode) this.changeVerifyCode();
                this.focus();
            },
            error: () => this.loading = false
        });
    }

    private submitMfa(): void {
        const code = (this.otp || "").trim();
        if (!code) return;
        this.loading = true;
        this.data.loginMfa(this.mfaTicket, code).subscribe({
            next: (result: LoginModel) => {
                this.loading = false;
                if (result.pass) {
                    this.renew(result.token);
                    return;
                }
                this.otp = "";
                this.error = result.reason;
                // the ticket is gone after too many attempts: start over from the password
                if (!result.mfaRequired) {
                    this.step = ReloginStep.PWD;
                    this.mfaTicket = null;
                    this.recoveryMode = false;
                    this.pwd = "";
                }
                this.focus();
            },
            error: () => this.loading = false
        });
    }

    // a six digit code is complete the moment it is typed
    onOtp(value: string): void {
        this.otp = value;
        if (!this.recoveryMode && value && value.trim().length === 6) {
            this.submit();
        }
    }

    switchRecovery(): void {
        this.recoveryMode = !this.recoveryMode;
        this.otp = "";
        this.error = "";
        this.focus();
    }

    changeVerifyCode(): void {
        this.verifyCodeMark = Math.ceil(Math.random() * new Date().getTime());
        this.verifyCodeUrl = DataService.getVerifyCodeUrl(this.verifyCodeMark);
    }

    // another account, or one that signs in through SSO: the full login page, back here afterwards
    toLoginPage(): void {
        this.cacheService.set(GlobalKeys.loginBackPath, this.router.url);
        this.modalRef.close();
        this.router.navigateByUrl("/passport/login").then();
    }

    // same account, so menus and permissions still hold: swap the token and stay on the page
    private renew(token: string): void {
        this.tokenService.set({token, account: this.account});
        WindowModel.eruptEvent?.login?.({token, account: this.account});
        if (EruptAppData.get().properties?.["erupt-websocket"]) {
            this.socketService.closeSocket();
            this.socketService.initWebSocket();
        }
        // the held requests go out again with this token
        this.modalRef.close(token);
    }

    private focus(): void {
        setTimeout(() => this.input?.nativeElement?.focus());
    }

}
