import {Component, Inject} from "@angular/core";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {DataService} from "@shared/service/data.service";
import {SettingsService} from "@delon/theme";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {Status} from "@shared/model/erupt-api.model";

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
              public modal: NzModalService,
              public data: DataService,
              public settingsService: SettingsService,
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
      return {equar: true};
    }
    return null;
  }

  // region: fields

  get pwd() {
    return this.form.controls["pwd"];
  }

  get newPwd() {
    return this.form.controls["newPwd"];
  }

  get newPwd2() {
    return this.form.controls["newPwd2"];
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
    this.data.changePwd(this.pwd.value, this.newPwd.value, this.newPwd2.value)
      .subscribe(api => {
        this.loading = false;
        if (api.status == Status.SUCCESS) {
          this.msg.success("密码修改成功");
          this.modal.closeAll();
          for (const i in this.form.controls) {
            this.form.controls[i].markAsDirty();
            this.form.controls[i].updateValueAndValidity();
            this.form.controls[i].setValue(null);
          }
        } else {
          this.error = api.message;
        }
      });
  }

}
