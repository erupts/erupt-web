import {EruptModel} from "../model/erupt.model";
/**
 * Created by liyuepeng on 11/19/18.
 */

interface PassAndMessage {
  pass: boolean;
  message: string;
}

export function EruptCheckReqData(eruptModel: EruptModel): PassAndMessage {
  let pass: boolean = true;
  let message: string = "";
  for (const obj of eruptModel.eruptFieldModels) {
    const edit = obj.eruptFieldJson.edit;
    if (edit.notNull) {
      if (!edit.$value) {
        console.log(edit);
        pass = false;
        message = edit.title + "必填";
        break;
      }
    }
  }
  return {
    pass: pass,
    message: message
  };
}

export function EruptCheckReqDataByToastr(eruptModel: EruptModel): boolean {
  let passMessage = EruptCheckReqData(eruptModel)
  if (!passMessage.pass) {
    // toastr.error(passMessage.message, "", {
    //   positionClass: "toast-bottom-right"
    // });
  }
  return passMessage.pass;
}
