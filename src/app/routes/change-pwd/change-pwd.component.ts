import { Component, Inject } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NzMessageService } from "ng-zorro-antd";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";

@Component({
  selector: "app-change-pwd",
  templateUrl: "./change-pwd.component.html",
  styleUrls: ["./change-pwd.component.less"],
  styles: []
})
export class ChangePwdComponent {

  form: FormGroup;
  error = "";
  type = 0;
  loading = false;
  visible = false;
  status = "pool";
  progress = 0;
  passwordProgressMap = {
    ok: "success",
    pass: "normal",
    pool: "exception"
  };

  constructor(fb: FormBuilder,
              public router: Router,
              public msg: NzMessageService,
              @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService
  ) {
    this.form = fb.group({
      pwd: [null, [Validators.required]],
      newPwd: [null, [Validators.required, Validators.minLength(6), ChangePwdComponent.checkPassword.bind(this)]],
      newPwd2: [null, [Validators.required, ChangePwdComponent.passwordEquar]]
    });
  }

  static checkPassword(control: FormControl) {
    if (!control) return null;
    const self: any = this;
    self.visible = !!control.value;
    if (control.value && control.value.length > 9) self.status = "ok";
    else if (control.value && control.value.length > 5) self.status = "pass";
    else self.status = "pool";

    if (self.visible)
      self.progress =
        control.value.length * 10 > 100 ? 100 : control.value.length * 10;
  }

  static passwordEquar(control: FormControl) {
    if (!control || !control.parent) return null;
    if (control.value !== control.parent.get("newPwd").value) {
      return { equar: true };
    }
    return null;
  }

  // region: fields

  get pwd() {
    return this.form.controls.pwd;
  }

  get newPwd() {
    return this.form.controls.newPwd;
  }

  get newPwd2() {
    return this.form.controls.newPwd2;
  }

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
    this.error = null;
    for (const i in this.form.controls) {
      this.form.controls[i].markAsDirty();
      this.form.controls[i].updateValueAndValidity();
    }
    if (this.form.invalid) return;
    this.loading = true;
    // 修改密码接口
    setTimeout(() => {
      this.loading = false;
      let param = {
        account: this.tokenService.get().account,
        pwd: this.pwd.value,
        newPwd: this.newPwd.value,
        newPwd2: this.newPwd2.value
      };

      for (const i in this.form.controls) {
        this.form.controls[i].setValue(null);
      }
    }, 1000);
  }

}
