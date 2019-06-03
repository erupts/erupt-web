import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { DataService } from "../../erupt/service/data.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-page",
  templateUrl: "./page.component.html",
  styleUrls: ["./page.component.less"]
  // encapsulation: ViewEncapsulation.None
})
export class PageComponent implements OnInit {

  constructor(public route: ActivatedRoute, public data: DataService, public httpClient: HttpClient) {

  }

  page: string;

  html: object;

  url: string;

  ngOnInit() {
    this.route.queryParamMap.subscribe(map => {
      if (map.has("file")) {
        this.url = "/page/" + map.get("file");
      } else if (map.has("site")) {
        this.url = map.get("site");
      }
      console.log(map);
    });
    // this.route.params.subscribe(params => {
    //   this.page = params.name;
    //   console.log(params);
    //   this.url = "/page/" + this.page;
    //   console.log(this.url);
    //   // this.httpClient.get("/page/" + params.name).subscribe(value => {
    //   //   alert(123)
    //   //   console.log(value);
    //   //   this.html = value;
    //   // });
    // });
  }

}
