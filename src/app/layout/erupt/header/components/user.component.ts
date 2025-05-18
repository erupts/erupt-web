import {Component, Inject} from "@angular/core";
import {Router} from "@angular/router";
import {SettingsService} from "@delon/theme";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {DataService} from "@shared/service/data.service";
import {I18NService} from "@core";
import {UserTool, WindowModel} from "@shared/model/window.model";
import {NzModalService} from "ng-zorro-antd/modal";
import {ResetPwdComponent} from "../../../../routes/reset-pwd/reset-pwd.component";
import {EruptAppData} from "@shared/model/erupt-app.model";
import {UtilsService} from "@shared/service/utils.service";
import {SocketService} from "@shared/service/socket.service";

@Component({
    selector: "header-user",
    template: `
        <div class="alain-default__nav-item d-flex align-items-center px-sm" nz-dropdown nzPlacement="bottomRight"
             [nzDropdownMenu]="avatarMenu">
            <nz-avatar [nzText]="settings.user.name&&settings.user.name.substr(0,1)" nzSize="default"
                       class="mr-sm"></nz-avatar>
            <span class="hidden-mobile">{{ settings.user.name }}</span>
        </div>
        <nz-dropdown-menu #avatarMenu>
            <div nz-menu class="width-sm" style="padding: 0">
                <div *ngIf="settings.user['tenantName']" style="padding: 8px 12px;border-bottom:1px solid #eee">
                    {{ settings.user['tenantName'] }}
                </div>
                <ng-container *ngIf="userTools">
                    <div nz-menu-item *ngFor="let tool of userTools" (click)="tool.click($event)">
                        <i *ngIf="tool.icon" [ngClass]="tool.icon" class="mr-sm"></i>
                        <span [innerHTML]="tool.text | safeHtml"></span>
                    </div>
                </ng-container>
                <div nz-menu-item (click)="changePwd()" *ngIf="resetPassword">
                    <i nz-icon nzType="edit" nzTheme="fill" class="mr-sm"></i>{{ 'global.reset_pwd'|translate }}
                </div>
                <div nz-menu-item (click)="logout()">
                    <i nz-icon nzType="logout" nzTheme="outline" class="mr-sm"></i>{{ 'global.logout'|translate }}
                </div>
            </div>
        </nz-dropdown-menu>
    `
})
export class HeaderUserComponent {

    resetPassword = EruptAppData.get().resetPwd;

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
