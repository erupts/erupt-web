import { AfterViewInit, Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "carousel-img",
  templateUrl: "./carousel-img.component.html",
  styles: []
})
export class CarouselImgComponent implements OnInit, AfterViewInit {

  @Input() images: string[];

  @Input() type: "image" | "swf" = "image";

  show: boolean = false;


  constructor() {
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.show = true;
    }, 200);
  }

}
