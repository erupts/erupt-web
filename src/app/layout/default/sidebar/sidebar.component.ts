import { Component, OnInit } from "@angular/core";
import { NzMessageService } from "ng-zorro-antd";
import { Menu, MenuService, SettingsService } from "@delon/theme";
import { DataService } from "../../../erupt/service/data.service";

@Component({
  selector: "layout-sidebar",
  templateUrl: "./sidebar.component.html"
})
export class SidebarComponent implements OnInit {

  constructor(public settings: SettingsService,
              public msgSrv: NzMessageService,
              public data: DataService,
              private menuService: MenuService) {
  }

  ngOnInit(): void {

  }

}
