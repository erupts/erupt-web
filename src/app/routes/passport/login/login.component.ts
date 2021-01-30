import {SettingsService} from "@delon/theme";
import {AfterViewInit, Component, Inject, Input, OnDestroy, OnInit, Optional} from "@angular/core";
import {Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {DA_SERVICE_TOKEN, SocialService, TokenService} from "@delon/auth";
import {ReuseTabService} from "@delon/abc";
import {StartupService} from "@core/startup/startup.service";
import {DataService} from "@shared/service/data.service";
import {CacheService} from "@delon/cache";
import {GlobalKeys} from "@shared/model/erupt-const";
import {Md5} from "ts-md5";
import {WindowModel} from "@shared/model/window.model";
import {generateMenuPath} from "@shared/util/erupt.util";
import {EruptAppService} from "@shared/service/erupt-app.service";

@Component({
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

    passwordType: 'password' | 'text' = 'password';

    @Input() isModal: boolean = false;

    useVerifyCode = false;

    verifyCodeUrl: string;

    registerPage: string = WindowModel.registerPage;

    constructor(
        fb: FormBuilder,
        private data: DataService,
        private router: Router,
        public msg: NzMessageService,
        private modalSrv: NzModalService,
        private settingsService: SettingsService,
        private socialService: SocialService,
        private eruptAppService: EruptAppService,
        @Optional()
        @Inject(ReuseTabService)
        private reuseTabService: ReuseTabService,
        @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
        private startupSrv: StartupService,
        private cacheService: CacheService
    ) {
        this.form = fb.group({
            userName: [null, [Validators.required, Validators.minLength(1)]],
            password: [null, Validators.required],
            verifyCode: [null],
            mobile: [null, [Validators.required, Validators.pattern(/^1\d{10}$/)]],
            remember: [true]
        });
    }

    ngOnInit(): void {

    }

    ngAfterViewInit(): void {
        if (this.eruptAppService.eruptAppModel.verifyCodeCount <= 0) {
            this.changeVerifyCode();
            Promise.resolve(null).then(() => this.useVerifyCode = true);
        }
    }

    // region: fields

    get userName() {
        return this.form.controls.userName;
    }

    get password() {
        return this.form.controls.password;
    }

    get verifyCode() {
        return this.form.controls.verifyCode;
    }

    // endregion
    switch(ret: any) {
        this.type = ret.index;
    }

    submit() {
        this.error = "";
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
        this.data.login(this.userName.value,
            <string>Md5.hashStr(Md5.hashStr(this.password.value) + (new Date().getDate() + "") + this.userName.value),
            this.verifyCode.value).subscribe((result) => {
            if (result.useVerifyCode) {
                this.changeVerifyCode();
            }
            this.useVerifyCode = result.useVerifyCode;
            if (result.pass) {
                if (result.indexMenu) {
                    let split = result.indexMenu.split("||");
                    result.indexPath = generateMenuPath(split[0], split[1]);
                }
                this.settingsService.setUser({name: result.userName, indexPath: result.indexPath});
                this.tokenService.set({token: result.token, expire: result.expire, account: this.userName.value});
                this.loading = false;
                let loginBackPath = this.cacheService.getNone(GlobalKeys.loginBackPath);
                // this.modalSrv.closeAll();
                if (loginBackPath) {
                    this.cacheService.remove(GlobalKeys.loginBackPath);
                    this.router.navigateByUrl(<string>loginBackPath).then();
                } else {
                    this.router.navigateByUrl(result.indexPath || '/').then();
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
        this.verifyCodeUrl = DataService.getVerifyCodeUrl();
    }

    ngOnDestroy(): void {

    }
}
