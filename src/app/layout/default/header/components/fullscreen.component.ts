import { ChangeDetectionStrategy, Component, HostListener } from "@angular/core";
import * as screenfull from "screenfull";

@Component({
  selector: "header-fullscreen",
  template: `
      <i nz-icon [nzType]="status ? 'fullscreen-exit' : 'fullscreen'"></i>
  `,
  host: {
    "[class.d-block]": "true"
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderFullScreenComponent {
  status = false;

  private get sf(): screenfull.Screenfull {
    return screenfull as screenfull.Screenfull;
  }

  @HostListener("window:resize")
  _resize() {
    this.status = this.sf.isFullscreen;
  }

  @HostListener("click")
  _click() {
    let sf = screenfull as screenfull.Screenfull;
    if (sf.enabled) {
      sf.toggle();
    }
  }
}
