import { EruptFieldModel } from "../model/erupt-field.model";
import { EruptModel, Tree } from "../model/erupt.model";
import { ChoiceEnum, EditType, TabEnum, ViewType } from "../model/erupt.enum";
import { FormControl } from "@angular/forms";
import { NzMessageService, NzModalService } from "ng-zorro-antd";
import { deepCopy } from "@delon/util";
import { Inject, Injectable } from "@angular/core";
import { QrComponent } from "@shared/qr/qr.component";
import { EruptAndEruptFieldModel } from "../model/erupt-page.model";
import { DataService } from "./data.service";

/**
 * Created by liyuepeng on 10/31/18.
 */

@Injectable()
export class DataHandlerService {

  constructor(@Inject(NzModalService) private modal: NzModalService,
              @Inject(NzMessageService) private msg: NzMessageService) {
  }

  //将view数据转换为alain table组件配置信息
  viewToAlainTableConfig(erupt: EruptModel): Array<any> {
    let cols = [];
    const views = erupt.tableColumns;
    for (let view of views) {
      let edit = view.eruptFieldModel.eruptFieldJson.edit;
      let obj: any = {
        // width: "200px",
        title: view.title,
        index: view.column
      };
      if (view.sortable) {
        obj.sort = {
          reName: {
            ascend: "asc",
            descend: "desc"
          },
          key: view.column
        };
      }

      //编辑类型
      switch (edit.type) {
        case EditType.BOOLEAN:
          obj.type = "yn";
          obj.className = "text-center";
          // obj.width = "66px";
          break;
        case EditType.CHOICE:
          if (edit.choiceType[0].type == ChoiceEnum.SELECT_SINGLE || edit.choiceType[0].type == ChoiceEnum.RADIO) {
            obj.format = (item: any) => {
              return edit.choiceType[0].vlMap.get(item[view.column]) || "";
            };
          } else {
            obj.type = "tag";
          }
          // else {
          //   obj.format = (item: any) => {
          //     return (<string>item[view.column]).split(edit.choiceType[0].joinSeparator);
          //   };
          // }
          break;
      }


      //数据类型
      if (view.eruptFieldModel.fieldReturnName === "Integer"
        || view.eruptFieldModel.fieldReturnName === "Float"
        || view.eruptFieldModel.fieldReturnName === "Double") {
        obj.type = "number";
        // obj.width = "100px";
      } else if (view.eruptFieldModel.fieldReturnName === "Date") {
        // obj.width = "100px";
        obj.type = "date";
      }

      //展示类型
      switch (view.viewType) {
        case ViewType.LINK:
          obj.type = "link";
          obj.click = (item) => {
            window.open(item[view.column]);
          };
          break;
        case ViewType.QR_CODE:
          obj.className = "text-center";
          obj.type = "link";
          // obj.width = "80px";
          obj.format = (item: any) => {
            if (item[view.column]) {
              return "<i class='fa fa-qrcode' aria-hidden='true'></i>";
            } else {
              return "";
            }
          };
          obj.click = (item) => {
            this.modal.create({
              nzWrapClassName: "modal-sm",
              nzMaskClosable: true,
              nzKeyboard: true,
              nzFooter: null,
              nzTitle: "查看二维码",
              nzContent: QrComponent,
              nzComponentParams: {
                value: item[view.column] + ""
              }
            });
          };
          break;
        case ViewType.IMAGE:
          obj.type = "link";
          obj.width = "80px";
          obj.className = "text-center";
          obj.format = (item: any) => {
            if (item[view.column]) {
              return `<img width="100%" class="text-center" src="${DataService.previewAttachment(erupt.eruptName, item[view.column])}" />`;
            } else {
              return "";
            }
          };
          obj.click = (item) => {
            this.modal.create({
              nzBodyStyle: {
                textAlign: "center"
              },
              nzWrapClassName: "modal-lg",
              nzMaskClosable: true,
              nzKeyboard: true,
              nzFooter: null,
              nzTitle: "查看图片",
              nzContent: `<img class="full-max-width" src="${DataService.previewAttachment(erupt.eruptName, item[view.column])}"/>`
            });
          };
          break;
        case ViewType.ATTACHMENT:
          obj.type = "link";
          obj.width = "80px";
          obj.className = "text-center";
          obj.format = (item: any) => {
            if (item[view.column]) {
              // return this.dataService.previewAttachment(erupt.eruptName, item[view.column]);
              return `<i class='fa fa-download' aria-hidden='true'></i>`;
            } else {
              return "";
            }
          };
          obj.click = (item) => {
            window.open(DataService.previewAttachment(erupt.eruptName, item[view.column]));
          };
          break;
      }

      if (view.template) {
        obj.format = (item: any) => {
          return view.template.replace("@txt@", item[view.column] || "");
        };
      }
      if (view.className) {
        obj.className += " " + view.className;
      }
      cols.push(obj);
    }
    return cols;
  }

  initErupt(eruptModel: EruptModel) {
    eruptModel.eruptJson.rowOperationMap = new Map();
    eruptModel.eruptJson.rowOperation.forEach(oper =>
      eruptModel.eruptJson.rowOperationMap.set(oper.code, oper)
    );
    eruptModel.tableColumns = [];
    eruptModel.eruptFieldModelMap = new Map<String, EruptFieldModel>();
    eruptModel.eruptFieldModels.forEach(field => {
      field.eruptFieldJson.edit.$value = field.value;
      eruptModel.eruptFieldModelMap.set(field.fieldName, field);
      switch (field.eruptFieldJson.edit.type) {
        case EditType.INPUT:
          const inputType = field.eruptFieldJson.edit.inputType;
          if (inputType.prefix.length > 0) {
            inputType.prefixValue = inputType.prefix[0].value;
          }
          if (inputType.suffix.length > 0) {
            inputType.suffixValue = inputType.suffix[0].value;
          }
          break;
        case EditType.SLIDER:
          const markPoints = field.eruptFieldJson.edit.sliderType[0].markPoints;
          const marks = field.eruptFieldJson.edit.sliderType[0].marks = {};
          if (markPoints.length > 0) {
            markPoints.forEach(m => {
              marks[m] = "";
            });
          }
          break;
        case EditType.CHOICE:
          const vlMap = field.eruptFieldJson.edit.choiceType[0].vlMap = new Map();
          field.eruptFieldJson.edit.choiceType[0].vl.forEach(vl => {
            vlMap.set(vl.value, vl.label);
          });
          break;
      }
      //生成columns
      field.eruptFieldJson.views.forEach(view => {
        if (!view.show) {
          return;
        }
        if (view.column) {
          view.column = field.fieldName + "_" + view.column.replace("\.", "_");
        } else {
          view.column = field.fieldName;
        }
        const deepField = <EruptFieldModel>deepCopy(field);
        deepField.eruptFieldJson.views = null;
        view.eruptFieldModel = deepField;
        eruptModel.tableColumns.push(view);
      });
    });
    // TODO 在eruptFieldModelMap填充完成执行该代码
    eruptModel.eruptFieldModels.forEach(field => {
      if (field.eruptFieldJson.edit.type === EditType.DEPEND_SWITCH) {
        field.eruptFieldJson.edit.dependSwitchType[0].dependSwitchAttrs.forEach(attr => {
          attr.dependEdits.forEach(editName => {
            const fm = eruptModel.eruptFieldModelMap.get(editName);
            if (fm) {
              fm.eruptFieldJson.edit.show = false;
            }
          });
        });
      }
    });
  }


  //非空验证
  validateNotNull(eruptModel: EruptModel): boolean {
    for (let field of eruptModel.eruptFieldModels) {
      if (field.eruptFieldJson.edit.notNull) {
        if (!field.eruptFieldJson.edit.$value) {
          this.msg.error(field.eruptFieldJson.edit.title + "必填！");
          return false;
        }
      }
    }
    return true;
  }

  dataTreeToZorroTree(nodes: Tree[]) {
    const tempNodes = [];
    nodes.forEach(node => {
      let option: any = {
        key: node.id,
        title: node.label,
        data: node.data,
        expanded: true
      };
      if (node.children && node.children.length > 0) {
        tempNodes.push(option);
        option.children = this.dataTreeToZorroTree(node.children);
      } else {
        option.isLeaf = true;
        tempNodes.push(option);
      }
    });
    return tempNodes;
  }

  //将eruptModel中的内容拼接成后台需要的json格式
  eruptValueToObject(eruptModel: EruptModel, subErupts?: Array<EruptAndEruptFieldModel>): object {
    // this.validateNotNull(eruptModel);
    const eruptData: any = {};
    eruptModel.eruptFieldModels.forEach(field => {
      switch (field.eruptFieldJson.edit.type) {
        case EditType.INPUT:
          const inputType = field.eruptFieldJson.edit.inputType;
          if (inputType.prefixValue || inputType.suffixValue) {
            eruptData[field.fieldName] = (inputType.prefixValue || "") + field.eruptFieldJson.edit.$value + (inputType.suffixValue || "");
          } else {
            eruptData[field.fieldName] = field.eruptFieldJson.edit.$value;
          }
          break;
        case EditType.CHOICE:
          if (field.eruptFieldJson.edit.$value) {
            if (field.eruptFieldJson.edit.choiceType[0].type === ChoiceEnum.SELECT_MULTI || field.eruptFieldJson.edit.choiceType[0].type === ChoiceEnum.TAGS) {
              let val = (<string[]>field.eruptFieldJson.edit.$value).join(field.eruptFieldJson.edit.choiceType[0].joinSeparator);
              if (val) {
                eruptData[field.fieldName] = val;
              }
            } else {
              eruptData[field.fieldName] = field.eruptFieldJson.edit.$value;
            }
          } else {
            eruptData[field.fieldName] = null;
          }
          break;
        case EditType.REFERENCE:
          if (field.eruptFieldJson.edit.$value) {
            eruptData[field.fieldName] = {};
            eruptData[field.fieldName][field.eruptFieldJson.edit.referenceTreeType[0].id] = field.eruptFieldJson.edit.$value;
          } else {
            field.eruptFieldJson.edit.$value = null;
          }
          break;
        default:
          eruptData[field.fieldName] = field.eruptFieldJson.edit.$value;
          break;
      }
    });
    if (subErupts && subErupts.length > 0) {
      subErupts.forEach(sub => {
        let tabType = sub.eruptFieldModel.eruptFieldJson.edit.tabType[0].type;
        if (tabType == TabEnum.TREE) {
          const tabTree = eruptData[sub.eruptFieldModel.fieldName] = [];
          if (sub.eruptFieldModel.eruptFieldJson.edit.$value) {
            (<any[]>sub.eruptFieldModel.eruptFieldJson.edit.$value).forEach(val => {
              const obj = {};
              obj[sub.eruptModel.eruptJson.primaryKeyCol] = val;
              tabTree.push(obj);
            });
          }
        }
      });
    }
    return eruptData;
  }

  //将后台数据转化成前端可视格式
  objectToEruptValue(eruptModel: EruptModel, object: any) {
    for (let field of eruptModel.eruptFieldModels) {
      if (field) {
        switch (field.eruptFieldJson.edit.type) {
          case EditType.INPUT:
            const inputType = field.eruptFieldJson.edit.inputType;
            //处理前缀和后缀的数据
            if (inputType.prefix.length > 0 || inputType.suffix.length > 0) {
              let str = <string>object[field.fieldName];
              for (let pre of inputType.prefix) {
                if (str.startsWith(pre.value)) {
                  field.eruptFieldJson.edit.inputType.prefixValue = pre.value;
                  str = str.substr(pre.value.length);
                  break;
                }
              }
              for (let suf of inputType.suffix) {
                if (str.endsWith(suf.value)) {
                  field.eruptFieldJson.edit.inputType.suffixValue = suf.value;
                  str = str.substr(0, str.length - suf.value.length);
                  break;
                }
              }
              field.eruptFieldJson.edit.$value = str;
            } else {
              field.eruptFieldJson.edit.$value = object[field.fieldName];
            }
            break;
          case EditType.DATE:
            field.eruptFieldJson.edit.$value = new FormControl(object[field.fieldName]).value;
            break;
          case EditType.REFERENCE:
            if (typeof object[field.fieldName] === "object") {
              field.eruptFieldJson.edit.$value = object[field.fieldName][field.eruptFieldJson.edit.referenceTreeType[0].id];
              field.eruptFieldJson.edit.$viewValue = object[field.fieldName][field.eruptFieldJson.edit.referenceTreeType[0].label];
            } else {
              field.eruptFieldJson.edit.$value = object[field.fieldName + "_" + field.eruptFieldJson.edit.referenceTreeType[0].id];
              field.eruptFieldJson.edit.$viewValue = object[field.fieldName + "_" + field.eruptFieldJson.edit.referenceTreeType[0].label];
            }
            break;
          case EditType.BOOLEAN:
            if (!object[field.fieldName] && object[field.fieldName] !== false) {
              field.eruptFieldJson.edit.$value = field.eruptFieldJson.edit.boolType[0].defaultValue;
            } else {
              field.eruptFieldJson.edit.$value = object[field.fieldName];
            }
            break;
          case EditType.ATTACHMENT:
            if (object[field.fieldName]) {
              field.eruptFieldJson.edit.$viewValue = [{
                url: DataService.previewAttachment(eruptModel.eruptName, object[field.fieldName])
              }];
              field.eruptFieldJson.edit.$value = object[field.fieldName];
            } else {
              field.eruptFieldJson.edit.$viewValue = [];
            }
            break;
          case EditType.CHOICE:
            if (field.eruptFieldJson.edit.choiceType[0].type === ChoiceEnum.SELECT_MULTI || field.eruptFieldJson.edit.choiceType[0].type === ChoiceEnum.TAGS) {
              if (object[field.fieldName]) {
                field.eruptFieldJson.edit.$value = String(object[field.fieldName]).split(field.eruptFieldJson.edit.choiceType[0].joinSeparator);
              } else {
                field.eruptFieldJson.edit.$value = [];
              }
            }
            break;
          default:
            field.eruptFieldJson.edit.$value = object[field.fieldName];
            break;
        }
      }
    }
  }

  loadEruptDefaultValue(eruptModel: EruptModel) {
    const obj = {};
    eruptModel.eruptFieldModels.forEach(ef => {
      if (ef.value) {
        obj[ef.fieldName] = ef.value;
      }
    });
    this.objectToEruptValue(eruptModel, obj);
  }

  emptyEruptValue(eruptModel: EruptModel, subFieldModels?: Array<EruptAndEruptFieldModel>) {
    eruptModel.eruptFieldModels.forEach(ef => {
      if (ef.eruptFieldJson.edit.type == EditType.BOOLEAN) {
        ef.eruptFieldJson.edit.$value = ef.eruptFieldJson.edit.boolType[0].defaultValue;
      } else {
        ef.eruptFieldJson.edit.$value = null;
        ef.eruptFieldJson.edit.$viewValue = null;
        ef.eruptFieldJson.edit.$tempValue = null;
      }
    });
    subFieldModels.forEach(sub => {
      sub.eruptFieldModel.eruptFieldJson.edit.$value = [];
    });

  }


}