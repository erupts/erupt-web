import { Component, OnInit } from "@angular/core";
import { SettingsService } from "@delon/theme";
import { DataService } from "../../../erupt/service/data.service";

interface menu {

}

@Component({
  selector: "layout-menu",
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.less"]
})
export class MenuComponent implements OnInit {

  private menu: any;

  constructor(public settings: SettingsService, private data: DataService) {
  }

  ngOnInit() {
    // 初始化菜单
    this.data.getMenu().subscribe(data => {
      this.menu = data;
      console.log(this.menu);
    });
  }

}
