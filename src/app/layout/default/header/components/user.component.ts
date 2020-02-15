import { Component, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { SettingsService } from "@delon/theme";
import { DA_SERVICE_TOKEN, ITokenService } from "@delon/auth";
import {DataService} from "@shared/service/data.service";

@Component({
  selector: "header-user",
  template: `
      <nz-dropdown nzPlacement="bottomRight">
          <div class="alain-default__nav-item d-flex align-items-center px-sm" nz-dropdown>
              <nz-avatar [nzText]="settings.user.name&&settings.user.name.substr(0,2)" nzSize="default" class="mr-sm"></nz-avatar>
              {{settings.user.name}}
          </div>
          <div nz-menu class="width-sm">
              <div nz-menu-item routerLink="/change-pwd">
                  <i nz-icon nzType="edit" nzTheme="fill" class="mr-sm"></i>修改密码
              </div>
              <div nz-menu-item (click)="logout()">
                  <i nz-icon nzType="logout" nzTheme="outline" class="mr-sm"></i>退出登录
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
    private data:DataService
  ) {
  }

  logout() {
    this.data.logout().subscribe();
    this.tokenService.clear();
    this.router.navigateByUrl(this.tokenService.login_url);
  }
}
