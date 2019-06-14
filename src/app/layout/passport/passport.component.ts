import { Component } from "@angular/core";
import { WindowModel } from "../../erupt/window.model";

@Component({
  selector: "layout-passport",
  templateUrl: "./passport.component.html",
  styleUrls: ["./passport.component.less"]
})
export class LayoutPassportComponent {

  nowYear = new Date().getFullYear();

  desc = WindowModel.desc;

  title = WindowModel.title;

  links = [
    {
      title: "帮助",
      href: ""
    },
    {
      title: "隐私",
      href: ""
    },
    {
      title: "条款",
      href: ""
    }
  ];
}
