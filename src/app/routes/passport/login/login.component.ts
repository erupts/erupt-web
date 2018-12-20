import { SettingsService } from "@delon/theme";
import { Component, OnDestroy, Inject, Optional, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import {
  SocialService,
  SocialOpenType,
  TokenService,
  DA_SERVICE_TOKEN
} from "@delon/auth";
import { ReuseTabService } from "@delon/abc";
import { environment } from "@env/environment";
import { StartupService } from "@core/startup/startup.service";
import { DataService } from "../../../erupt/service/data.service";

@Component({
  selector: "passport-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.less"],
  providers: [SocialService]
})
export class UserLoginComponent implements OnDestroy, OnInit {

  form: FormGroup;
  error = "";
  type = 0;
  loading = false;

  useVerifyCode = true;

  verifyCodeUrl: string = this.data.getVerifyCodeUrl();

  constructor(
    fb: FormBuilder,
    private data: DataService,
    private router: Router,
    public msg: NzMessageService,
    private modalSrv: NzModalService,
    private settingsService: SettingsService,
    private socialService: SocialService,
    @Optional()
    @Inject(ReuseTabService)
    private reuseTabService: ReuseTabService,
    @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
    private startupSrv: StartupService
  ) {
    this.form = fb.group({
      userName: [null, [Validators.required, Validators.minLength(5)]],
      password: [null, Validators.required],
      mobile: [null, [Validators.required, Validators.pattern(/^1\d{10}$/)]],
      captcha: [null, [Validators.required]],
      remember: [true]
    });
    modalSrv.closeAll();
  }

  ngOnInit(): void {

  }

  // region: fields

  get userName() {
    return this.form.controls.userName;
  }

  get password() {
    return this.form.controls.password;
  }

  get mobile() {
    return this.form.controls.mobile;
  }

  get captcha() {
    return this.form.controls.captcha;
  }

  // endregion

  switch(ret: any) {
    this.type = ret.index;
  }

  // region: get captcha

  count = 0;
  interval$: any;

  getCaptcha() {
    this.count = 59;
    this.interval$ = setInterval(() => {
      this.count -= 1;
      if (this.count <= 0) clearInterval(this.interval$);
    }, 1000);
  }

  // endregion

  submit() {
    this.error = "";
    if (this.type === 0) {
      this.userName.markAsDirty();
      this.userName.updateValueAndValidity();
      this.password.markAsDirty();
      this.password.updateValueAndValidity();
      if (this.userName.invalid || this.password.invalid) return;
    } else {
      this.mobile.markAsDirty();
      this.mobile.updateValueAndValidity();
      this.captcha.markAsDirty();
      this.captcha.updateValueAndValidity();
      if (this.mobile.invalid || this.captcha.invalid) return;
    }
    this.loading = true;
    this.data.login(this.userName.value.toString(), this.password.value.toString(), 123).subscribe((result) => {
      this.loading = false;
      this.error = result.reason;
      this.useVerifyCode = result.useVerifyCode;
      console.log(result);
      if (!result.pass) {
        this.changeVerifyCode();
      }
      this.reuseTabService.clear();
      // this.router.navigate(["/"]);
    });


    setTimeout(() => {

      // // 设置Token信息
      // this.tokenService.set({
      //   token: "123456789",
      //   name: this.userName.value,
      //   email: `cipchk@qq.com`,
      //   id: 10000,
      //   time: +new Date()
      // });

    }, 1000);
  }

  // region: social

  open(type: string, openType: SocialOpenType = "href") {
    let url = ``;
    let callback = ``;
    if (environment.production)
      callback = "https://ng-alain.github.io/ng-alain/callback/" + type;
    else callback = "http://localhost:4200/callback/" + type;
    switch (type) {
      case "auth0":
        url = `//cipchk.auth0.com/login?client=8gcNydIDzGBYxzqV0Vm1CX_RXH-wsWo5&redirect_uri=${decodeURIComponent(
          callback
        )}`;
        break;
      case "github":
        url = `//github.com/login/oauth/authorize?client_id=9d6baae4b04a23fcafa2&response_type=code&redirect_uri=${decodeURIComponent(
          callback
        )}`;
        break;
      case "weibo":
        url = `https://api.weibo.com/oauth2/authorize?client_id=1239507802&response_type=code&redirect_uri=${decodeURIComponent(
          callback
        )}`;
        break;
    }
    if (openType === "window") {
      this.socialService
        .login(url, "/", {
          type: "window"
        })
        .subscribe(res => {
          if (res) {
            this.settingsService.setUser(res);
            this.router.navigateByUrl("/");
          }
        });
    } else {
      this.socialService.login(url, "/", {
        type: "href"
      });
    }
  }


  changeVerifyCode() {
    this.verifyCodeUrl = this.data.getVerifyCodeUrl();
  }

  // endregion

  ngOnDestroy(): void {
    if (this.interval$) clearInterval(this.interval$);
  }
}
