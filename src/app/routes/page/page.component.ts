import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { DataService } from "../../erupt/service/data.service";

@Component({
  selector: "app-page",
  templateUrl: "./page.component.html",
  styleUrls: ["./page.component.less"],
  // encapsulation: ViewEncapsulation.None
})
export class PageComponent implements OnInit {

  constructor(public route: ActivatedRoute, public data: DataService) {

  }

  public page: string;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.page = params.name;
    });
  }

}
