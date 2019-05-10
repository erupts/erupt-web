import { Component } from "@angular/core";
import { SettingsService } from "@delon/theme";
import * as screenfull from "screenfull";

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

  constructor(public settings: SettingsService) {
  }

  toggleCollapsedSidebar() {
    this.settings.setLayout("collapsed", !this.settings.layout.collapsed);
  }

  searchToggleChange() {
    this.searchToggleStatus = !this.searchToggleStatus;
  }

  toggleScreen(){
    let sf = screenfull as screenfull.Screenfull;
    if (sf.enabled) {
      this.isFullScreen = sf.isFullscreen;
      sf.toggle();
    }
  }

  // toggleScreen() {
  //   const sf = screenfull as screenfull.Screenfull;
  //   if (sf.enabled) {
  //     sf.toggle();
  //   }
  //
  //   // if (screenfull.enabled) {
  //   //   screenfull.toggle();
  //   //   this.isFullScreen = !this.isFullScreen;
  //   // }
  // }
}
