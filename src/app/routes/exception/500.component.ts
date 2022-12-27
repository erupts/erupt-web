import {Component, Inject} from '@angular/core';
import {Router} from "@angular/router";
import {NzModalService} from "ng-zorro-antd/modal";

@Component({
  selector: 'exception-500',
  template: `
    <exception type="500" style="min-height: 700px; height: 80%;">
      <div> {{message}} </div>
      <!--            <button nz-button nzType="primary" style="margin-top: 16px">-->
      <!--                <i nz-icon nzType="reload"></i>-->
      <!--                重新加载-->
      <!--            </button>-->
    </exception>
  `
})
export class Exception500Component {

  message: string = "";

  constructor(@Inject(NzModalService) private modal: NzModalService, private router: Router) {
    let params = router.getCurrentNavigation().extras.queryParams;
    if (params) {
      this.message = params["message"];
    }
    modal.closeAll();
  }
}
