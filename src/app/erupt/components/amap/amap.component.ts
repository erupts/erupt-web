import { Component, ElementRef, OnInit } from "@angular/core";
import { LazyService } from "@delon/util";
import { WindowModel } from "../../window.model";

declare const AMap;

@Component({
  selector: "gaode-map",
  templateUrl: "./amap.component.html",
  styles: []
})
export class AmapComponent implements OnInit {

  loading: boolean;

  constructor(private lazy: LazyService, private ref: ElementRef) {
  }

  ngOnInit() {
    this.loading = true;
    this.lazy.loadScript("https://webapi.amap.com/maps?v=1.4.14&key=" + WindowModel.amapKey).then(() => {
      this.loading = false;
      let map = new AMap.Map(this.ref.nativeElement.querySelector("#amap"), {
        resizeEnable: true,
        center: [116.480983, 39.989628],
        zoom: 11
      });
    });
  }

}
