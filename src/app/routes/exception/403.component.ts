import {Component, Inject} from '@angular/core';
import {NzModalService} from "ng-zorro-antd/modal";

@Component({
  selector: 'exception-403',
  template: `<exception type="403" style="min-height: 700px; height: 80%;"></exception>`,
})
export class Exception403Component {
  constructor(@Inject(NzModalService) private modal: NzModalService) {
    modal.closeAll();
  }
}
