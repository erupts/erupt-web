import {Component, Inject} from "@angular/core";
import {Router} from "@angular/router";
import {ALAIN_I18N_TOKEN, SettingsService} from "@delon/theme";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {DataService} from "@shared/service/data.service";
import {NzModalService} from "ng-zorro-antd";
import {ChangePwdComponent} from "../../../../routes/change-pwd/change-pwd.component";
import {I18NService} from "@core";

@Component({
    selector: "header-user",
    template: `
        <nz-dropdown nzPlacement="bottomRight">
            <div class="alain-default__nav-item d-flex align-items-center px-sm" nz-dropdown>
                <nz-avatar [nzText]="settings.user.name&&settings.user.name.substr(0,1)" nzSize="default" class="mr-sm"></nz-avatar>
                {{settings.user.name}}
            </div>
            <div nz-menu class="width-sm">
                <div nz-menu-item (click)="changePwd()">
                    <i nz-icon nzType="edit" nzTheme="fill" class="mr-sm"></i>{{'global.reset_pwd'|translate}}
                </div>
                <div nz-menu-item (click)="logout()">
                    <i nz-icon nzType="logout" nzTheme="outline" class="mr-sm"></i>{{'global.logout'|translate}}
                </div>
            </div>
        </nz-dropdown>
    `
})
export class HeaderUserComponent {
    constructor(
        public settings: SettingsService,
        private router: Router,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
        @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
        private data: DataService,
        @Inject(NzModalService)
        private modal: NzModalService,
    ) {
    }

    logout() {
        this.modal.confirm({
            nzTitle: this.i18n.fanyi("global.confirm_logout"),
            nzOnOk: () => {
                this.data.logout().subscribe();
                this.tokenService.clear();
                this.router.navigateByUrl(this.tokenService.login_url);
            }
        });
    }

    changePwd() {
        this.modal.create({
            nzTitle: this.i18n.fanyi("global.reset_pwd"),
            nzMaskClosable: false,
            nzContent: ChangePwdComponent,
            nzFooter: null,
            nzBodyStyle: {
                paddingBottom: '1px'
            }
        });
    }
}
