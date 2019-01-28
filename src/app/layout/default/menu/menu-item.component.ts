import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-menu-item",
  templateUrl: "./menu-item.component.html",
  styles: []
})
export class MenuItemComponent implements OnInit {

  @Input() menuItem;

  constructor() {
  }

  ngOnInit() {
  }

}
