import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {IframeHeight} from "@shared/util/window.util";

@Component({
  selector: 'erupt-iframe',
  template: `
    <nz-spin [nzSpinning]="spin">
      <iframe [src]="url|safeUrl" style="width: 100%;border: 0;display: block;vertical-align: bottom;" [ngStyle]="style"
              (load)="iframeHeight($event)">

      </iframe>
    </nz-spin>
  `,
  styles: []
})
export class EruptIframeComponent implements OnInit, OnChanges {

  @Input() url: string | undefined;

  @Input() height: string | undefined;

  @Input() style: object = {};

  spin: boolean = true;

  constructor() {

  }

  ngOnInit() {
    this.spin = true;
  }

  iframeHeight(event: any) {
    this.spin = false;
    if (!this.height) {
      IframeHeight(event);
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    // if (!changes.url.firstChange) {
    //   this.spin = true;
    // }
  }



}
