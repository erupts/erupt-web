import { Component, Inject } from "@angular/core";
import { SettingsService } from "@delon/theme";
import * as screenfull from "screenfull";
import { DA_SERVICE_TOKEN, ITokenService } from "@delon/auth";
import { CustomerTool, WindowModel } from "../../../erupt/model/window.model";

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

  title = WindowModel.title;

  r_tools: CustomerTool[] = WindowModel.r_tools;

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