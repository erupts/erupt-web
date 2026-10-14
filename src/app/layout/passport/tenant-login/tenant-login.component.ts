import {AfterViewInit, Component, Inject, Input, OnDestroy, OnInit, Optional} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {DA_SERVICE_TOKEN, SocialService, TokenService} from "@delon/auth";
import {DataService} from "@shared/service/data.service";
import {CacheService} from "@delon/cache";
import {GlobalKeys} from "@shared/model/erupt-const";
import {WindowModel} from "@shared/model/window.model";
import {I18NService} from "@core";
import {NzMessageService} from "ng-zorro-antd/message";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {EruptTenantInfoData} from "../../../build/erupt/model/erupt-tenant";
import {SsoProvider} from "@shared/model/user.model";
import {Subscription} from "rxjs";
import {debounceTime, distinctUntilChanged} from "rxjs/operators";

@Component({
    standalone: false,
    selector: "passport-login",
    templateUrl: "./tenant-login.component.html",
    styleUrls: ["./tenant-login.component.less"],
    providers: [SocialService]
})
export class UserTenantLoginComponent implements OnDestroy, OnInit, AfterViewInit {

    form: FormGroup;

    error = "";

    loading = false;

    passwordType: 'password' | 'text' = 'password';

    @Input() modelFun: Function;

    useVerifyCode = false;

    verifyCodeUrl: string;

    registerPage: string = WindowModel.registerPage;

    verifyCodeMark: number;

    tenantLogin: boolean;

    tenantDomainInfo = EruptTenantInfoData.get();

    ssoProviders: SsoProvider[] = [];

    //cashing in the ticket the provider callback brought back
    ssoLoading = false;

    private tenantCode$: Subscription;

    constructor(
        fb: FormBuilder,
        private data: DataService,
        private router: Router,
        private route: ActivatedRoute,
        public msg: NzMessageService,
        private i18n: I18NService,
        @Optional()
        @Inject(ReuseTabService)
        private reuseTabService: ReuseTabService,
        @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
        private cacheService: CacheService
    ) {
        this.tenantLogin = !!EruptAppData.get().properties["erupt-tenant"]
        this.form = fb.group({
            tenantCode: [null, Validators.required],
            userName: [null, [Validators.required, Validators.minLength(1)]],
            password: [null, Validators.required],
            verifyCode: [null],
            mobile: [null, [Validators.required, Validators.pattern(/^1\d{10}$/)]],
            remember: [true]
        });
        if (this.tenantDomainInfo) {
            this.tenantCode.setValue(this.tenantDomainInfo.code);
        } else if (this.route.snapshot.queryParams["tenantCode"]) {
            //the sign-on callback comes back with the tenant it was started for
            this.tenantCode.setValue(this.route.snapshot.queryParams["tenantCode"]);
        }
    }

    ngOnInit(): void {
        if (EruptAppData.get().loginPagePath) {
            window.location.href = EruptAppData.get().loginPagePath;
        }
        this.initSso();
    }

    ngAfterViewInit(): void {
        if (EruptAppData.get().verifyCodeCount <= 0) {
            this.changeVerifyCode();
            Promise.resolve(null).then(() => this.useVerifyCode = true);
        }
    }

    // region: fields

    get tenantCode() {
        return this.form.controls['tenantCode'];
    }

    get userName() {
        return this.form.controls['userName'];
    }

    get password() {
        return this.form.controls['password'];
    }

    get verifyCode() {
        return this.form.controls['verifyCode'];
    }

    submit() {
        this.error = "";
        this.tenantCode.markAsDirty();
        this.tenantCode.updateValueAndValidity();
        this.userName.markAsDirty();
        this.userName.updateValueAndValidity();
        this.password.markAsDirty();
        this.password.updateValueAndValidity();
        if (this.useVerifyCode) {
            this.verifyCode.markAsDirty();
            this.userName.updateValueAndValidity();
        }
        if (this.userName.invalid || this.password.invalid) return;
        this.loading = true;
        let pwd = this.password.value;
        if (EruptAppData.get().pwdTransferEncrypt) {
            pwd = this.data.pwdEncode(this.password.value, 3);
        }
        this.data.tenantLogin(this.tenantCode.value, this.userName.value, pwd, this.verifyCode.value, this.verifyCodeMark).subscribe((result) => {
            if (result.useVerifyCode) this.changeVerifyCode();
            this.useVerifyCode = result.useVerifyCode;
            if (result.pass) {
                this.enterApp(result.token, this.userName.value);
            } else {
                this.loading = false;
                this.error = result.reason;
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

    private enterApp(token: string, account: string) {
        this.tokenService.set({token, account});
        if (WindowModel.eruptEvent && WindowModel.eruptEvent.login) {
            WindowModel.eruptEvent.login({token, account});
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

    //the provider redirect lands here: either a ticket to cash in or a message to show
    private initSso() {
        if (!EruptAppData.get().properties || !EruptAppData.get().properties["erupt-sso"]) return;
        const params = this.route.snapshot.queryParams;
        if (params["ssoError"]) {
            this.error = params["ssoError"];
            this.clearSsoParams();
        } else if (params["ssoTicket"]) {
            this.ssoLoading = this.loading = true;
            this.data.ssoExchange(params["ssoTicket"]).subscribe(result => {
                if (result.pass) {
                    this.reuseTabService.clear();
                    this.enterApp(result.token, result.account);
                    return;
                }
                this.clearSsoParams();
                this.ssoLoading = this.loading = false;
                this.error = result.reason;
            }, () => {
                this.clearSsoParams();
                this.ssoLoading = this.loading = false;
            });
        }
        //the providers are the tenant's own, so the list follows the enterprise id being typed
        this.loadSsoProviders(this.tenantCode.value);
        this.tenantCode$ = this.tenantCode.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
            .subscribe(code => this.loadSsoProviders(code));
    }

    private loadSsoProviders(tenantCode: string) {
        if (!tenantCode) {
            this.ssoProviders = [];
            return;
        }
        // a provider list that cannot be fetched is an empty list, not a broken login page
        this.data.ssoProviders(tenantCode).subscribe(providers => this.ssoProviders = providers || [], () => this.ssoProviders = []);
    }

    //a spent ticket has no business surviving a refresh; the tenant code stays
    private clearSsoParams() {
        const tenantCode = this.route.snapshot.queryParams["tenantCode"];
        this.router.navigate([], {relativeTo: this.route, queryParams: tenantCode ? {tenantCode} : {}, replaceUrl: true}).then();
    }

    //three named buttons still fit one row of the card; past that only the icons do
    get ssoCompact(): boolean {
        return this.ssoProviders.length > 3;
    }

    toSso(provider: SsoProvider) {
        this.error = "";
        this.ssoLoading = this.loading = true;
        //a full page navigation: the provider has to see the browser, not an XHR
        window.location.href = DataService.ssoAuthorizeUrl(provider.code, this.tenantCode.value);
    }

    changeVerifyCode() {
        this.verifyCodeMark = Math.ceil(Math.random() * new Date().getTime());
        this.verifyCodeUrl = DataService.getVerifyCodeUrl(this.verifyCodeMark);
    }

    forgot() {
        this.msg.error(this.i18n.fanyi('login.forget_pwd_hint'));
    }

    toLogin() {
        this.router.navigateByUrl('/passport/login').then(r => true)
    }

    ngOnDestroy(): void {
        this.tenantCode$?.unsubscribe();
    }
}
