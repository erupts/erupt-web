import {Component, Inject} from '@angular/core';
import {NzModalService} from "ng-zorro-antd/modal";

@Component({
  selector: 'exception-404',
  template: `<exception type="404" style="min-height: 700px; height: 80%;"></exception>`,
})
export class Exception404Component {
  constructor(@Inject(NzModalService) private modal: NzModalService) {
    modal.closeAll();
  }
}
