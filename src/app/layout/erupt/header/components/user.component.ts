import {Component, Inject} from "@angular/core";
import {Router} from "@angular/router";
import {SettingsService} from "@delon/theme";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {DataService} from "@shared/service/data.service";
import {I18NService} from "@core";
import {WindowModel} from "@shared/model/window.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {ResetPwdComponent} from "../../../../routes/reset-pwd/reset-pwd.component";

@Component({
    selector: "header-user",
    template: `
        <div class="alain-default__nav-item d-flex align-items-center px-sm" nz-dropdown nzPlacement="bottomRight"
             [nzDropdownMenu]="avatarMenu">
            <nz-avatar [nzText]="settings.user.name&&settings.user.name.substr(0,1)" nzSize="default"
                       class="mr-sm"></nz-avatar>
            <span class="hidden-mobile">{{settings.user.name}}</span>
        </div>
        <nz-dropdown-menu #avatarMenu>
            <div nz-menu class="width-sm">
                <div nz-menu-item (click)="changePwd()">
                    <i nz-icon nzType="edit" nzTheme="fill" class="mr-sm"></i>{{'global.reset_pwd'|translate}}
                </div>
                <div nz-menu-item (click)="logout()">
                    <i nz-icon nzType="logout" nzTheme="outline" class="mr-sm"></i>{{'global.logout'|translate}}
                </div>
            </div>
        </nz-dropdown-menu>
    `
})
export class HeaderUserComponent {
    constructor(
        public settings: SettingsService,
        private router: Router,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
        private i18n: I18NService,
        private dataService: DataService,
        @Inject(NzModalService)
        private modal: NzModalService,
    ) {
    }

    logout() {
        this.modal.confirm({
            nzTitle: this.i18n.fanyi("global.confirm_logout"),
            nzOnOk: () => {
                this.dataService.logout().subscribe(data => {
                    if (WindowModel.eruptEvent && WindowModel.eruptEvent.logout) {
                        WindowModel.eruptEvent.logout({
                            userName: this.settings.user.name,
                            token: this.tokenService.get().token
                        })
                    }
                    this.tokenService.clear();
                    this.router.navigateByUrl(this.tokenService.login_url);
                });
            }
        });
    }

    changePwd() {
        this.modal.create({
            nzTitle: this.i18n.fanyi("global.reset_pwd"),
            nzMaskClosable: false,
            nzContent: ResetPwdComponent,
            nzFooter: null,
            nzBodyStyle: {
                paddingBottom: '1px'
            }
        });
    }
}
