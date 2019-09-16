import { Component, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { SettingsService } from "@delon/theme";
import { DA_SERVICE_TOKEN, ITokenService } from "@delon/auth";

@Component({
  selector: "header-user",
  template: `
      <div class="alain-default__nav-item d-flex align-items-center px-sm"
           nz-dropdown
           nzPlacement="bottomRight"
           [nzDropdownMenu]="userMenu">
          <nz-avatar [nzText]="settings.user.name&&settings.user.name.substr(0,2)" nzSize="default" class="mr-sm"></nz-avatar>
          {{ settings.user.name }}
      </div>
      <nz-dropdown-menu #userMenu="nzDropdownMenu">
          <div nz-menu class="width-sm">
              <div nz-menu-item routerLink="/change-pwd">
                  <i nz-icon nzType="edit" nzTheme="fill" class="mr-sm"></i>修改密码
              </div>
              <div nz-menu-item (click)="logout()">
                  <i nz-icon nzType="logout" nzTheme="outline"></i> 退出登录
              </div>
          </div>
      </nz-dropdown-menu>
  `
})
export class HeaderUserComponent {
  constructor(
    public settings: SettingsService,
    private router: Router,
    @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService
  ) {
  }

  logout() {
    this.tokenService.clear();
    this.router.navigateByUrl(this.tokenService.login_url);
  }
}
