import { Inject, Injectable } from "@angular/core";
import { ModalHelperOptions } from "@delon/theme";
import { NzModalService } from "ng-zorro-antd";

@Injectable({
  providedIn: "root"
})
export class HelperService {

  constructor(@Inject(NzModalService) private modal: NzModalService) {
  }

  modalHelper(comp: any, params?: any,
              title?: string, size?: "modal-xs" | "modal-sm" | "modal-md" | "modal-lg" | "modal-xl" | string,
              okClick?: any) {
    this.modal.create({
      nzWrapClassName: size,
      nzKeyboard: true,
      nzTitle: title,
      nzCancelText: "取消（ESC）",
      nzOnOk: okClick,
      nzContent: comp,
      nzComponentParams: params
    });
  }
}
