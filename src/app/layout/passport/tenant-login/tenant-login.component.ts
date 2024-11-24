import {AfterViewInit, Component, Inject, Input, OnDestroy, OnInit, Optional} from "@angular/core";
import {Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {DA_SERVICE_TOKEN, SocialService, TokenService} from "@delon/auth";
import {DataService} from "@shared/service/data.service";
import {CacheService} from "@delon/cache";
import {GlobalKeys} from "@shared/model/erupt-const";
import {Md5} from "ts-md5";
import {WindowModel} from "@shared/model/window.model";
import {I18NService} from "@core";
import {NzMessageService} from "ng-zorro-antd/message";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {EruptTenantInfoData} from "../../../build/erupt/model/erupt-tenant";

@Component({
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

    constructor(
        fb: FormBuilder,
        private data: DataService,
        private router: Router,
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
        }
    }

    ngOnInit(): void {
        if (EruptAppData.get().loginPagePath) {
            window.location.href = EruptAppData.get().loginPagePath;
        }
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
            pwd = <string>Md5.hashStr(Md5.hashStr(this.password.value) + this.userName.value);
        }
        this.data.tenantLogin(this.tenantCode.value, this.userName.value, pwd, this.verifyCode.value, this.verifyCodeMark).subscribe((result) => {
            if (result.useVerifyCode) this.changeVerifyCode();
            this.useVerifyCode = result.useVerifyCode;
            if (result.pass) {
                this.tokenService.set({
                    token: result.token,
                    account: this.userName.value
                });
                if (WindowModel.eruptEvent && WindowModel.eruptEvent.login) {
                    WindowModel.eruptEvent.login({
                        token: result.token,
                        account: this.userName.value
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
    }
}
