import {Component, Inject} from '@angular/core';
import { NzModalService } from 'ng-zorro-antd';

@Component({
  selector: 'exception-500',
  template: `<exception type="500" style="min-height: 700px; height: 80%;"></exception>`,
})
export class Exception500Component {
  constructor(@Inject(NzModalService) private modal: NzModalService) {
    modal.closeAll();
  }
}
