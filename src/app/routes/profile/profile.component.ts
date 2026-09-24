import {Component, Inject} from "@angular/core";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {SettingsService} from "@delon/theme";
import {NzMessageService} from "ng-zorro-antd/message";
import {NzModalRef} from "ng-zorro-antd/modal";
import {NzUploadChangeParam} from "ng-zorro-antd/upload";
import {DataService} from "@shared/service/data.service";
import {I18NService} from "@core";
import {RestPath} from "../../build/erupt/model/erupt.enum";
import {EruptApiModel, Status} from "../../build/erupt/model/erupt-api.model";

/**
 * Self-service profile: the signed-in user changes their own avatar and display name.
 * Everything else about an account stays with the administrator in user management.
 */
@Component({
    standalone: false,
    selector: "erupt-profile",
    templateUrl: "./profile.component.html",
    styleUrls: ["./profile.component.less"]
})
export class ProfileComponent {

    form: FormGroup;

    error = "";

    loading = false;

    uploading = false;

    //the value stored server side: an uploaded path or an absolute URL
    avatar: string;

    uploadAction = RestPath.erupt + "/profile/avatar";

    uploadHeaders: { token: string };

    constructor(fb: FormBuilder,
                public settings: SettingsService,
                private data: DataService,
                private msg: NzMessageService,
                private i18n: I18NService,
                private modalRef: NzModalRef,
                @Inject(DA_SERVICE_TOKEN) tokenService: ITokenService) {
        this.uploadHeaders = {token: tokenService.get().token || ''};
        this.avatar = settings.user['avatarPath'] || null;
        this.form = fb.group({
            name: [settings.user.name, [Validators.required, Validators.maxLength(255)]]
        });
    }

    get name() {
        return this.form.controls['name'];
    }

    get avatarUrl(): string {
        return DataService.resolveAvatar(this.avatar);
    }

    beforeUpload = (file: any): boolean => {
        if (!/^image\//.test(file.type)) {
            this.msg.error(this.i18n.fanyi("profile.avatar_image_only"));
            return false;
        }
        return true;
    };

    uploadChange({file}: NzUploadChangeParam) {
        this.uploading = file.status === "uploading";
        if (file.status === "done") {
            const api = <EruptApiModel>file.response;
            if (api.status === Status.ERROR) {
                this.error = api.message;
            } else {
                this.error = "";
                this.avatar = api.data;
            }
        } else if (file.status === "error") {
            this.msg.error(this.i18n.fanyi("edit_type.upload_failed"));
        }
    }

    removeAvatar() {
        this.avatar = null;
    }

    submit() {
        this.name.markAsDirty();
        this.name.updateValueAndValidity();
        if (this.form.invalid) return;
        this.error = "";
        this.loading = true;
        this.data.updateProfile(this.name.value.trim(), this.avatar).subscribe(api => {
            this.loading = false;
            if (api.status === Status.SUCCESS) {
                this.settings.setUser({
                    ...this.settings.user,
                    name: this.name.value.trim(),
                    avatar: this.avatarUrl,
                    avatarPath: this.avatar
                });
                this.msg.success(this.i18n.fanyi("global.update.success"));
                this.modalRef.close();
            } else {
                this.error = api.message;
            }
        }, () => this.loading = false);
    }

}
