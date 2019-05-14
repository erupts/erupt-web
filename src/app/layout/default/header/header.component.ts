import { Component, Inject } from "@angular/core";
import { SettingsService } from "@delon/theme";
import * as screenfull from "screenfull";
import { DA_SERVICE_TOKEN, ITokenService, TokenService } from "@delon/auth";

@Component({
  selector: "layout-header",
  templateUrl: "./header.component.html",
  styleUrls: [
    "./header.component.less"
  ]
})
export class HeaderComponent {
  searchToggleStatus: boolean;

  isFullScreen: boolean = false;

  collapse: boolean = false;

  title = window["site"]["name"];

  l_tools: CustomerTool[] = window["l_tools"] || [];

  r_tools: CustomerTool[] = window["r_tools"] || [];

  constructor(public settings: SettingsService, @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
  }

  toggleCollapsedSidebar() {
    this.settings.setLayout("collapsed", !this.settings.layout.collapsed);
  }

  searchToggleChange() {
    this.searchToggleStatus = !this.searchToggleStatus;
  }

  toggleScreen() {
    let sf = screenfull as screenfull.Screenfull;
    if (sf.enabled) {
      this.isFullScreen = sf.isFullscreen;
      sf.toggle();
    }
  }

  customToolsFun(event: Event, tool: CustomerTool) {
    tool.click && tool.click(event, this.tokenService.get().token);
  }
}

interface CustomerTool {
  html: string;

  icon: string;

  mobileShow: boolean;

  click(event: Event, token: string): void;
}
