import {Component, OnInit} from "@angular/core";
import {SettingsService} from "@delon/theme";

@Component({
  selector: "layout-sidebar",
  templateUrl: "./sidebar.component.html"
})
export class SidebarComponent implements OnInit {

  constructor(public settings: SettingsService) {
  }

  ngOnInit(): void {

  }

}
