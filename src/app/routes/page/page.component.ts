import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-page",
  templateUrl: "./page.component.html",
  styles: []
})
export class PageComponent implements OnInit {

  constructor(public route: ActivatedRoute) {
  }

  public page: string;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.page = params.name;
    });
  }

}
