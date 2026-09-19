import {Component, OnInit} from "@angular/core";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {DataService} from "@shared/service/data.service";
import {I18NService} from "@core";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalRef} from "ng-zorro-antd/modal";
import {MfaEnroll, MfaStatus} from "@shared/model/user.model";
import {Status} from "../../build/erupt/model/erupt-api.model";

/**
 * Self service enrolment for a TOTP authenticator.
 *
 * Enrolment runs scan → verify → save the recovery codes; the secret only reaches the
 * server side database once a code proves the user really scanned it.
 */
@Component({
    standalone: false,
    selector: "erupt-mfa",
    templateUrl: "./mfa.component.html",
    styleUrls: ["./mfa.component.less"]
})
export class MfaComponent implements OnInit {

    loading = false;

    error = "";

    status: MfaStatus;

    //0 scan, 1 verify, 2 recovery codes
    step = 0;

    enroll: MfaEnroll;

    secretVisible = false;

    recoveryCodes: string[];

    //the codes are shown once, so the dialog stays open until the user confirms they kept them
    recoveryAcknowledged = false;

    form: FormGroup;

    unbindForm: FormGroup;

    unbinding = false;

    constructor(private fb: FormBuilder,
                private data: DataService,
                private i18n: I18NService,
                private msg: NzMessageService,
                private modalRef: NzModalRef) {
        this.form = fb.group({code: [null, [Validators.required]]});
        this.unbindForm = fb.group({
            pwd: [null, [Validators.required]],
            code: [null, [Validators.required]]
        });
    }

    ngOnInit(): void {
        this.loading = true;
        this.data.mfaStatus().subscribe(status => {
            this.loading = false;
            this.status = status;
        }, () => this.loading = false);
    }

    fanyi(key: string) {
        return this.i18n.fanyi(key);
    }

    startEnroll() {
        this.error = "";
        this.loading = true;
        this.data.mfaEnroll().subscribe(res => {
            this.loading = false;
            if (res.status === Status.SUCCESS) {
                this.enroll = res.data;
                this.step = 0;
            } else {
                this.error = res.message;
            }
        }, () => this.loading = false);
    }

    confirmEnroll() {
        this.form.controls['code'].markAsDirty();
        this.form.controls['code'].updateValueAndValidity();
        if (this.form.invalid) return;
        this.error = "";
        this.loading = true;
        this.data.mfaEnrollConfirm(this.form.value.code).subscribe(res => {
            this.loading = false;
            if (res.status === Status.SUCCESS) {
                this.recoveryCodes = res.data;
                this.step = 2;
            } else {
                this.error = res.message;
                this.form.controls['code'].setValue(null);
            }
        }, () => this.loading = false);
    }

    regenerate() {
        this.form.controls['code'].markAsDirty();
        this.form.controls['code'].updateValueAndValidity();
        if (this.form.invalid) return;
        this.error = "";
        this.loading = true;
        this.data.mfaRecoveryCodes(this.form.value.code).subscribe(res => {
            this.loading = false;
            if (res.status === Status.SUCCESS) {
                this.recoveryCodes = res.data;
                this.recoveryAcknowledged = false;
                this.step = 2;
            } else {
                this.error = res.message;
            }
            this.form.controls['code'].setValue(null);
        }, () => this.loading = false);
    }

    unbind() {
        for (const key in this.unbindForm.controls) {
            this.unbindForm.controls[key].markAsDirty();
            this.unbindForm.controls[key].updateValueAndValidity();
        }
        if (this.unbindForm.invalid) return;
        this.error = "";
        this.loading = true;
        this.data.mfaUnbind(this.unbindForm.value.pwd, this.unbindForm.value.code).subscribe(res => {
            this.loading = false;
            if (res.status === Status.SUCCESS) {
                this.msg.success(this.fanyi("mfa.unbind_success"));
                this.modalRef.close();
            } else {
                this.error = res.message;
                this.unbindForm.controls['code'].setValue(null);
            }
        }, () => this.loading = false);
    }

    copySecret() {
        this.copy(this.enroll.secret, "mfa.secret_copied", false);
    }

    copyRecoveryCodes() {
        this.copy(this.recoveryCodes.join("\n"), "mfa.recovery_copied", true);
    }

    downloadRecoveryCodes() {
        const blob = new Blob([this.recoveryCodes.join("\n")], {type: "text/plain;charset=utf-8"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "erupt-recovery-codes.txt";
        a.click();
        URL.revokeObjectURL(url);
        this.recoveryAcknowledged = true;
    }

    done() {
        this.modalRef.close();
    }

    private copy(text: string, successKey: string, acknowledge: boolean) {
        navigator.clipboard.writeText(text).then(() => {
            this.msg.success(this.fanyi(successKey));
            if (acknowledge) this.recoveryAcknowledged = true;
        }, () => this.msg.error(this.fanyi("mfa.copy_failed")));
    }

}
