import { Component } from "@angular/core";

@Component({
  selector: "layout-passport",
  templateUrl: "./passport.component.html",
  styleUrls: ["./passport.component.less"]
})
export class LayoutPassportComponent {

  nowYear = new Date().getFullYear();

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
