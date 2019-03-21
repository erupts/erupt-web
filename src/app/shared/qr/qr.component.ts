import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-qr",
  templateUrl: "./qr.component.html",
  styles: []
})
export class QrComponent implements OnInit {

  @Input() value: string;

  constructor() {
  }

  ngOnInit() {
  }

}
