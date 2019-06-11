import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { DataService } from "../../erupt/service/data.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-page",
  templateUrl: "./page.component.html",
  styleUrls: ["./page.component.less"]
})
export class PageComponent implements OnInit {

  constructor(public route: ActivatedRoute, public data: DataService) {
  }

  page: string;

  html: object;

  url: string;

  targetUrl: string;

  ngOnInit() {
    this.route.queryParamMap.subscribe(map => {
      this.url = null;
      this.targetUrl = null;
      if (map.has("page")) {
        this.url = "/page/" + map.get("page");
      } else if (map.has("site")) {
        let target = map.get("target");
        if (target === "blank") {
          this.targetUrl = map.get("site");
          window.open(this.targetUrl);
        } else {
          this.url = map.get("site");
        }
      }
    });
  }

}
