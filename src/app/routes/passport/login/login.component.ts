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

  useVerifyCode = false;

  verifyCodeUrl: string;

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
      verifyCode: [null],
      mobile: [null, [Validators.required, Validators.pattern(/^1\d{10}$/)]],
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

  get verifyCode() {
    return this.form.controls.verifyCode;
  }

  // endregion
  switch(ret: any) {
    this.type = ret.index;
  }


  // endregion
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
    this.data.login(this.userName.value, this.password.value, this.verifyCode.value).subscribe((result) => {
      this.loading = false;
      if (result.useVerifyCode) {
        this.changeVerifyCode();
      }
      this.useVerifyCode = result.useVerifyCode;
      if (result.pass) {
        this.settingsService.setUser({
          name: result.userName
        });
        this.tokenService.set({
          token: result.token,
          time: +new Date()
        });
        this.router.navigate(["/"]);
      } else {
        this.error = result.reason;
        this.verifyCode.setValue(null);
        if (result.useVerifyCode) {
          this.changeVerifyCode();
        }
      }
      this.reuseTabService.clear();
    });
  }

  changeVerifyCode() {
    this.verifyCodeUrl = this.data.getVerifyCodeUrl(this.form.controls.userName.value);
    console.log(this.verifyCodeUrl);
  }


  ngOnDestroy(): void {

  }
}
