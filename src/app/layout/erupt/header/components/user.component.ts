import {Component, Inject} from "@angular/core";
import {Router} from "@angular/router";
import {SettingsService} from "@delon/theme";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {DataService} from "@shared/service/data.service";
import {I18NService} from "@core";
import {UserTool, WindowModel} from "@shared/model/window.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {MfaComponent} from "../../../../routes/mfa/mfa.component";
import {ResetPwdComponent} from "../../../../routes/reset-pwd/reset-pwd.component";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {UtilsService} from "@shared/service/utils.service";
import {SocketService} from "@shared/service/socket.service";

@Component({
    standalone: false,
    selector: "header-user",
    template: `
        <div class="alain-default__nav-item d-flex align-items-center px-sm" nz-dropdown nzPlacement="bottomRight"
          [nzDropdownMenu]="avatarMenu">
          <nz-avatar class="mr-sm" [nzText]="settings.user.name&&settings.user.name.substring(0,1)"
            [nzSrc]="settings.user.avatar||null"
          nzSize="default"></nz-avatar>
          <span class="hidden-mobile">{{ settings.user.name }}</span>
        </div>
        <nz-dropdown-menu #avatarMenu>
          <div nz-menu class="width-sm" style="padding: 0">
            @if (settings.user['tenantName']) {
              <div style="padding: 8px 12px;border-bottom:1px solid #eee">
                {{ settings.user['tenantName'] }}
              </div>
            }
            @if (userTools) {
              @for (tool of userTools; track tool) {
                <div nz-menu-item (click)="tool.click($event)">
                  @if (tool.icon) {
                    <i [ngClass]="tool.icon" class="mr-sm"></i>
                  }
                  <span [innerHTML]="tool.text | safeHtml"></span>
                </div>
              }
            }
            @if (resetPassword) {
              <div nz-menu-item (click)="changePwd()">
                <i nz-icon nzType="edit" nzTheme="fill" class="mr-sm"></i>{{ 'global.reset_pwd'|translate }}
              </div>
            }
            @if (mfaEnable) {
              <div nz-menu-item (click)="mfa()">
                <i nz-icon nzType="safety-certificate" nzTheme="fill" class="mr-sm"></i>{{ 'global.mfa'|translate }}
                @if (mfaUnprotected) {
                  <nz-badge nzStatus="error" class="ml-sm"></nz-badge>
                }
              </div>
            }
            <div nz-menu-item (click)="logout()">
              <i nz-icon nzType="logout" nzTheme="outline" class="mr-sm"></i>{{ 'global.logout'|translate }}
            </div>
          </div>
        </nz-dropdown-menu>
        `
})
export class HeaderUserComponent {

    resetPassword = EruptAppData.get().resetPwd;

    //the switch is server side, a tenant session has no platform MFA binding of its own
    mfaEnable = !!(EruptAppData.get().mfa && EruptAppData.get().mfa.enable);

    //undefined until the status call answers, so the dot never flashes for a bound user
    mfaBound: boolean;

    //the server offers MFA and this account has not taken it up
    get mfaUnprotected(): boolean {
        return this.mfaEnable && this.mfaBound === false;
    }

    userTools: UserTool[] = WindowModel.userTools;

    constructor(
        public settings: SettingsService,
        private router: Router,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
        private i18n: I18NService,
        private dataService: DataService,
        @Inject(NzModalService)
        private modal: NzModalService,
        private utilsService: UtilsService,
        private socketService: SocketService,
    ) {
        if (this.mfaEnable && !this.utilsService.isTenantToken()) {
            this.dataService.mfaStatus().subscribe(status => this.mfaBound = status.bound);
        } else {
            this.mfaEnable = false;
        }
    }

    logout() {
        this.modal.confirm({
            nzTitle: this.i18n.fanyi("global.confirm_logout"),
            nzOnOk: () => {
                this.dataService.logout().subscribe(data => {
                    this.socketService.closeSocket();
                    let token = this.tokenService.get().token;
                    if (WindowModel.eruptEvent && WindowModel.eruptEvent.logout) {
                        WindowModel.eruptEvent.logout({
                            userName: this.settings.user.name,
                            token: token
                        })
                    }
                    if (this.utilsService.isTenantToken()) {
                        this.router.navigateByUrl("/passport/tenant");
                    } else {
                        this.router.navigateByUrl(this.tokenService.login_url);
                    }
                    this.tokenService.clear();
                });
            }
        });
    }

    mfa() {
        this.modal.create({
            nzDraggable: true,
            nzTitle: this.i18n.fanyi("global.mfa"),
            nzMaskClosable: false,
            nzContent: MfaComponent,
            nzFooter: null,
            nzWidth: 460
        }).afterClose.subscribe(() => {
            this.dataService.mfaStatus().subscribe(status => this.mfaBound = status.bound);
        });
    }

    changePwd() {
        this.modal.create({
            nzDraggable:true,
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
