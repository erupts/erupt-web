import { Component, Inject } from "@angular/core";
import { SettingsService } from "@delon/theme";
import * as screenfull from "screenfull";
import { DA_SERVICE_TOKEN, TokenService } from "@delon/auth";

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

  collapse:boolean = false;

  constructor(public settings: SettingsService) {
  }

  toggleCollapsedSidebar() {
    this.settings.setLayout("collapsed", !this.settings.layout.collapsed);
  }

  searchToggleChange() {
    this.searchToggleStatus = !this.searchToggleStatus;
  }

  toggleScreen() {
    if (screenfull.enabled) {
      screenfull.toggle();
      this.isFullScreen = !this.isFullScreen;
    }
  }
}
