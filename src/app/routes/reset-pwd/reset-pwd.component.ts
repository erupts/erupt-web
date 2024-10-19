import {Component, Inject} from "@angular/core";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {DataService} from "@shared/service/data.service";
import {SettingsService} from "@delon/theme";
import {EruptApiModel, Status} from "../../build/erupt/model/erupt-api.model";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalService} from "ng-zorro-antd/modal";
import {I18NService} from "@core";
import {Observable} from "rxjs";
import {UtilsService} from "@shared/service/utils.service";

@Component({
    selector: "reset-pwd",
    templateUrl: "./reset-pwd.component.html",
    styleUrls: ["./reset-pwd.component.less"],
    styles: []
})
export class ResetPwdComponent {

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
                public msg: NzMessageService,
                public modal: NzModalService,
                public router: Router,
                public data: DataService,
                private i18n: I18NService,
                public settingsService: SettingsService,
                private utilsService: UtilsService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService
    ) {
        this.form = fb.group({
            pwd: [null, [Validators.required]],
            newPwd: [null, [Validators.required, Validators.minLength(6), ResetPwdComponent.checkPassword.bind(this)]],
            newPwd2: [null, [Validators.required, ResetPwdComponent.passwordEquar]]
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

    fanyi(key: string) {
        return this.i18n.fanyi(key);
    }

    // region: fields

    get pwd() {
        return this.form.controls['pwd'];
    }

    get newPwd() {
        return this.form.controls['newPwd'];
    }

    get newPwd2() {
        return this.form.controls['newPwd2'];
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

        let pwdObservable: Observable<EruptApiModel>;

        if (this.utilsService.isTenantToken()) {
            pwdObservable = this.data.tenantChangePwd(this.pwd.value, this.newPwd.value, this.newPwd2.value)
        } else {
            pwdObservable = this.data.changePwd(this.pwd.value, this.newPwd.value, this.newPwd2.value)
        }
        pwdObservable.subscribe(api => {
            this.loading = false;
            if (api.status == Status.SUCCESS) {
                this.msg.success(this.i18n.fanyi("global.update.success"));
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
