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

  public page: string;

  public html: object;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.page = params.name;
      // this.httpClient.get("/page/" + params.name).subscribe(value => {
      //   alert(123)
      //   console.log(value);
      //   this.html = value;
      // });
    });
  }

}
