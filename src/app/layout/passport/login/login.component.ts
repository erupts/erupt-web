import {
    AfterViewInit,
    Component,
    ElementRef,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Optional,
    ViewChild
} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {DA_SERVICE_TOKEN, SocialService, TokenService} from "@delon/auth";
import {DataService} from "@shared/service/data.service";
import {CacheService} from "@delon/cache";
import {GlobalKeys} from "@shared/model/erupt-const";
import {WindowModel} from "@shared/model/window.model";
import {I18NService} from "@core";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {EruptTenantInfoData} from "../../../build/erupt/model/erupt-tenant";
import {SsoProvider} from "@shared/model/user.model";
import {NzDrawerService} from "ng-zorro-antd/drawer";
import {Subscription} from "rxjs";

@Component({
    standalone: false,
    selector: "passport-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.less"],
    providers: [SocialService]
})
export class UserLoginComponent implements OnDestroy, OnInit, AfterViewInit {

    form: FormGroup;

    error = "";

    type = 0;

    loading = false;

    @ViewChild('pwdInput', {static: false}) pwdInput: ElementRef;
    @ViewChild('userInput', {static: false}) userInput: ElementRef;
    @ViewChild('otpInput', {static: false}) otpInput: ElementRef;

    passwordType: 'password' | 'text' = 'password';

    capsLock = false;

    shaking = false;


    private static readonly REMEMBER_KEY = 'erupt_remember_account';

    @Input() modelFun: Function;

    useVerifyCode = false;

    verifyCodeUrl: string;

    registerPage: string = WindowModel.registerPage;

    verifyCodeMark: number;

    //set once the password was accepted and a one-time code is still owed
    mfaTicket: string = null;

    //the code screen also accepts a single use recovery code
    recoveryMode = false;

    //sign-on buttons, empty when no provider is configured
    ssoProviders: SsoProvider[] = [];

    //the browser came back from a provider and the ticket is being cashed in
    ssoLoading = false;

    private otpSubscription: Subscription;

    tenantLogin: boolean;

    tenantDomainInfo = EruptTenantInfoData.get();

    constructor(
        fb: FormBuilder,
        private data: DataService,
        private router: Router,
        private route: ActivatedRoute,
        public msg: NzMessageService,
        @Inject(NzModalService)
        private modal: NzModalService,
        private drawer: NzDrawerService,
        private i18n: I18NService,
        @Optional()
        @Inject(ReuseTabService)
        private reuseTabService: ReuseTabService,
        @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
        private cacheService: CacheService
    ) {
        this.tenantLogin = !!(EruptAppData.get().properties && EruptAppData.get().properties["erupt-tenant"])
        const savedAccount = localStorage.getItem(UserLoginComponent.REMEMBER_KEY);
        this.form = fb.group({
            userName: [savedAccount, [Validators.required, Validators.minLength(1)]],
            password: [null, Validators.required],
            verifyCode: [null],
            otp: [null],
            mobile: [null, [Validators.required, Validators.pattern(/^1\d{10}$/)]],
            rememberAccount: [!!savedAccount]
        });
        if (this.tenantDomainInfo) {
            this.router.navigateByUrl('/passport/tenant').then(r => true)
        }
    }

    ngOnInit(): void {
        if (EruptAppData.get().loginPagePath) {
            window.location.href = EruptAppData.get().loginPagePath;
        }
        this.initSso();
        //a six digit code is complete the moment it is typed, no reason to make the user click
        this.otpSubscription = this.otp.valueChanges.subscribe(value => {
            if (this.mfaTicket && !this.recoveryMode && !this.loading
                && value && value.trim().length === 6) {
                this.submitMfa();
            }
        });
    }

    ngAfterViewInit(): void {
        this.modal.closeAll()
        if (EruptAppData.get().verifyCodeCount <= 0) {
            this.changeVerifyCode();
            Promise.resolve(null).then(() => this.useVerifyCode = true);
        }
        setTimeout(() => {
            if (this.userName.value) {
                this.pwdInput?.nativeElement?.focus();
            } else {
                this.userInput?.nativeElement?.focus();
            }
        });
    }

    // region: fields

    get userName() {
        return this.form.controls['userName'];
    }

    get password() {
        return this.form.controls['password'];
    }

    get verifyCode() {
        return this.form.controls['verifyCode'];
    }

    get otp() {
        return this.form.controls['otp'];
    }

    // endregion
    switch(ret: any) {
        this.type = ret.index;
    }

    submit() {
        this.error = "";
        if (this.mfaTicket) {
            this.submitMfa();
            return;
        }
        if (this.type === 0) {
            this.userName.markAsDirty();
            this.userName.updateValueAndValidity();
            this.password.markAsDirty();
            this.password.updateValueAndValidity();
            if (this.useVerifyCode) {
                this.verifyCode.markAsDirty();
                this.userName.updateValueAndValidity();
            }
            if (this.userName.invalid || this.password.invalid) return;
        }
        this.loading = true;
        let pwd = this.password.value;
        if (EruptAppData.get().pwdTransferEncrypt) {
            pwd = this.data.pwdEncode(this.password.value, 3);
        }
        this.data.login(this.userName.value, pwd, this.verifyCode.value, this.verifyCodeMark).subscribe((result) => {
            if (result.useVerifyCode) this.changeVerifyCode();
            this.useVerifyCode = result.useVerifyCode;
            if (result.mfaRequired) {
                this.loading = false;
                this.enterMfaStep(result.mfaTicket);
                return;
            }
            if (result.pass) {
                this.enterApp(result.token);
            } else {
                this.loading = false;
                this.fail(result.reason);
                this.verifyCode.setValue(null);
                if (result.useVerifyCode) {
                    this.changeVerifyCode();
                }
            }
            this.reuseTabService.clear();
        }, () => {
            this.loading = false;
        });
    }

    //second step: the password was already accepted, only the one-time code is missing
    submitMfa() {
        let code = (this.otp.value || "").trim();
        if (!code) return;
        this.loading = true;
        this.data.loginMfa(this.mfaTicket, code).subscribe(result => {
            this.loading = false;
            if (result.pass) {
                this.enterApp(result.token);
                this.reuseTabService.clear();
                return;
            }
            this.otp.setValue(null);
            this.fail(result.reason);
            //the ticket is gone after too many attempts, send the user back to the password screen
            if (!result.mfaRequired) this.exitMfaStep();
        }, () => {
            this.loading = false;
        });
    }

    //the provider redirect lands here: either a ticket to cash in or a message to show
    private initSso() {
        const params = this.route.snapshot.queryParams;
        if (params["ssoError"]) {
            this.fail(params["ssoError"]);
            this.clearSsoParams();
        } else if (params["ssoTicket"]) {
            this.ssoLoading = this.loading = true;
            this.data.ssoExchange(params["ssoTicket"]).subscribe(result => {
                if (result.pass) {
                    //entering the app navigates away, which drops the spent ticket with it
                    this.reuseTabService.clear();
                    this.enterApp(result.token, result.account);
                    return;
                }
                this.clearSsoParams();
                this.ssoLoading = this.loading = false;
                this.fail(result.reason);
            }, () => {
                this.clearSsoParams();
                this.ssoLoading = this.loading = false;
            });
        }
        //erupt-sso is optional; without the module there is no endpoint to ask
        if (EruptAppData.get().properties && EruptAppData.get().properties["erupt-sso"]) {
            this.data.ssoProviders().subscribe(providers => this.ssoProviders = providers || []);
        }
    }

    //a spent ticket has no business surviving a refresh
    private clearSsoParams() {
        this.router.navigate([], {relativeTo: this.route, queryParams: {}, replaceUrl: true}).then();
    }

    toSso(provider: SsoProvider) {
        this.error = "";
        this.ssoLoading = this.loading = true;
        //a full page navigation: the provider has to see the browser, not an XHR
        window.location.href = DataService.ssoAuthorizeUrl(provider.code);
    }

    enterMfaStep(ticket: string) {
        this.mfaTicket = ticket;
        this.recoveryMode = false;
        this.otp.setValue(null);
        setTimeout(() => this.otpInput?.nativeElement?.focus());
    }

    exitMfaStep() {
        this.mfaTicket = null;
        this.recoveryMode = false;
        this.otp.setValue(null);
        this.password.setValue(null);
        setTimeout(() => this.pwdInput?.nativeElement?.focus());
    }

    switchRecovery() {
        this.recoveryMode = !this.recoveryMode;
        this.otp.setValue(null);
        this.error = "";
        setTimeout(() => this.otpInput?.nativeElement?.focus());
    }

    private enterApp(token: string, account?: string) {
        //an account typed on this page is the only one worth remembering
        if (!account) {
            if (this.form.value.rememberAccount) {
                localStorage.setItem(UserLoginComponent.REMEMBER_KEY, this.userName.value);
            } else {
                localStorage.removeItem(UserLoginComponent.REMEMBER_KEY);
            }
        }
        account = account || this.userName.value;
        this.tokenService.set({
            token: token,
            account: account
        });
        if (WindowModel.eruptEvent && WindowModel.eruptEvent.login) {
            WindowModel.eruptEvent.login({
                token: token,
                account: account
            });
        }
        this.loading = false;
        if (!this.modelFun) {
            let loginBackPath = this.cacheService.getNone(GlobalKeys.loginBackPath);
            if (loginBackPath) {
                this.cacheService.remove(GlobalKeys.loginBackPath);
                this.router.navigateByUrl(<string>loginBackPath).then();
            } else {
                this.router.navigateByUrl("/").then();
            }
        } else {
            this.modelFun();
        }
    }

    private fail(reason: string) {
        this.error = reason;
        this.shaking = true;
        setTimeout(() => this.shaking = false, 400);
    }

    changeVerifyCode() {
        this.verifyCodeMark = Math.ceil(Math.random() * new Date().getTime());
        this.verifyCodeUrl = DataService.getVerifyCodeUrl(this.verifyCodeMark);
    }

    focusPwd() {
        this.pwdInput?.nativeElement?.focus();
    }

    forgot() {
        this.msg.error(this.i18n.fanyi('login.forget_pwd_hint'));
    }

    toTenant() {
        this.router.navigateByUrl('/passport/tenant').then(r => true)
    }

    ngOnDestroy(): void {
        this.otpSubscription?.unsubscribe();
    }
}
