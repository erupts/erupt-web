import { EruptFieldModel } from "../model/erupt-field.model";
import { EruptModel, Tree } from "../model/erupt.model";
import { ChoiceEnum, EditType, SaveMode, ViewType } from "../model/erupt.enum";
import { FormControl } from "@angular/forms";
import { NzMessageService, NzModalService, UploadFile } from "ng-zorro-antd";
import { deepCopy } from "@delon/util";
import { Inject, Injectable } from "@angular/core";
import { EruptBuildModel } from "../model/erupt-build.model";
import { DataService } from "./data.service";
import { ViewTypeComponent } from "../view-type/view-type.component";
import { STColumn } from "@delon/abc";

/**
 * Created by liyuepeng on 10/31/18.
 */

@Injectable()
export class DataHandlerService {

  constructor(
    @Inject(NzModalService) private modal: NzModalService,
    @Inject(NzMessageService) private msg: NzMessageService) {
  }

  initErupt(em: EruptBuildModel) {
    this.buildErupt(em.eruptModel);
    if (em.tabErupts) {
      for (let key in em.tabErupts) {
        if (em.tabErupts[key] && em.eruptModel.eruptFieldModelMap.get(key).eruptFieldJson.edit.type != EditType.TAB_TREE) {
          this.buildErupt(em.tabErupts[key]);
        }
      }
    }
    if (em.combineErupts) {
      for (let key in em.combineErupts) {
        this.buildErupt(em.combineErupts[key]);
      }
    }
    if (em.referenceErupts) {
      for (let key in em.referenceErupts) {
        this.buildErupt(em.referenceErupts[key]);
      }
    }
  }

  buildErupt(eruptModel: EruptModel) {
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
          const markPoints = field.eruptFieldJson.edit.sliderType.markPoints;
          const marks = field.eruptFieldJson.edit.sliderType.marks = {};
          if (markPoints.length > 0) {
            markPoints.forEach(m => {
              marks[m] = "";
            });
          }
          break;
        case EditType.CHOICE:
          const vlMap = field.eruptFieldJson.edit.choiceType.vlMap = new Map();
          field.eruptFieldJson.edit.choiceType.vl.forEach(vl => {
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
    //生成depend组件代码
    eruptModel.eruptFieldModels.forEach(field => {
      if (field.eruptFieldJson.edit.type === EditType.DEPEND_SWITCH) {
        field.eruptFieldJson.edit.dependSwitchType.dependSwitchAttrs.forEach(attr => {
          if (field.value && field.value == attr.value) {
            return;
          } else {
            attr.dependEdits.forEach(editName => {
              const fm = eruptModel.eruptFieldModelMap.get(editName);
              if (fm) {
                fm.eruptFieldJson.edit.show = false;
              }
            });
          }
        });
      }
    });
  }


  buildSearchErupt(eruptBuildModel: EruptBuildModel): EruptModel {
    let copyErupt = <EruptModel>deepCopy(eruptBuildModel.eruptModel);
    const searchFieldModels = [];
    const searchFieldModelsMap: Map<String, EruptFieldModel> = new Map();
    copyErupt.eruptFieldModels.forEach((field) => {
      searchFieldModelsMap.set(field.fieldName, field);
      if (field.eruptFieldJson.edit.search.value) {
        field.value = null;
        field.eruptFieldJson.edit.notNull = false;
        field.eruptFieldJson.edit.show = true;
        field.eruptFieldJson.edit.$value = null;
        field.eruptFieldJson.edit.$viewValue = null;
        field.eruptFieldJson.edit.$tempValue = null;
        searchFieldModels.push(field);
      }
    });
    copyErupt.mode = "search";
    copyErupt.eruptFieldModels = searchFieldModels;
    copyErupt.eruptFieldModelMap = searchFieldModelsMap;
    return copyErupt;
  }

  //将view数据转换为alain table组件配置信息
  viewToAlainTableConfig(erupt: EruptModel): STColumn[] {
    let cols: STColumn[] = [];
    const views = erupt.tableColumns;
    for (let view of views) {
      let edit = view.eruptFieldModel.eruptFieldJson.edit;
      let obj: STColumn = {
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

      // 编辑类型
      switch (edit.type) {
        case EditType.BOOLEAN:
          obj.type = "yn";
          obj.className = "text-center";
          obj.yn = {
            truth: edit.boolType.trueText
            // mode: "full",
            // yes: edit.boolType.trueText,
            // no: edit.boolType.falseText
          };
          break;
        case EditType.CHOICE:
          // if (edit.choiceType.type == ChoiceEnum.SELECT_SINGLE || edit.choiceType.type == ChoiceEnum.RADIO) {
          //   obj.format = (item) => {
          //     return edit.choiceType.vlMap.get(item[view.column]) + "" || "";
          //   };
          // } else {
          //   obj.type = "tag";
          // }
          break;
      }

      //数据类型
      if (view.eruptFieldModel.fieldReturnName === "number") {
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
        case ViewType.LINK_DIALOG:
          obj.className = "text-center";
          obj.type = "link";
          obj.click = (item) => {
            this.modal.create({
              nzWrapClassName: "modal-lg modal-body-nopadding",
              nzStyle: { top: "20px" },
              nzMaskClosable: false,
              nzKeyboard: true,
              nzFooter: null,
              nzTitle: "查看",
              nzContent: ViewTypeComponent,
              nzComponentParams: {
                value: item[view.column],
                view: view
              }
            });
          };
          break;
        case ViewType.QR_CODE:
          obj.className = "text-center";
          obj.type = "link";
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
              nzTitle: "查看",
              nzContent: ViewTypeComponent,
              nzComponentParams: {
                value: item[view.column],
                view: view
              }
            });
          };
          break;
        case ViewType.IMAGE:
          obj.type = "link";
          obj.width = "90px";
          obj.className = "text-center";
          obj.format = (item: any) => {
            if (item[view.column]) {
              const attachmentType = view.eruptFieldModel.eruptFieldJson.edit.attachmentType;
              let img = item[view.column];
              if (attachmentType.maxLimit > 1) {
                img = (<string>item[view.column]).split(attachmentType.fileSeparator)[0];
              }
              return `<img width="100%" class="text-center" src="${DataService.previewAttachment(img)}" />`;
            } else {
              return "";
            }
          };
          obj.click = (item) => {
            this.modal.create({
              nzWrapClassName: "modal-lg",
              nzMaskClosable: true,
              nzKeyboard: true,
              nzFooter: null,
              nzTitle: "查看",
              nzContent: ViewTypeComponent,
              nzComponentParams: {
                value: item[view.column],
                view: view
              }
            });
          };
          break;
        case ViewType.HTML:
          obj.type = "link";
          obj.className = "text-center";
          obj.format = (item: any) => {
            if (item[view.column]) {
              return `<i class='fa fa-file-text' aria-hidden='true'></i>`;
            } else {
              return "";
            }
          };
          obj.click = (item) => {
            this.modal.create({
              nzWrapClassName: "modal-lg",
              nzMaskClosable: true,
              nzKeyboard: true,
              nzFooter: null,
              nzTitle: "查看",
              nzContent: ViewTypeComponent,
              nzComponentParams: {
                value: item[view.column],
                view: view
              }
            });
          };
          break;
        case ViewType.SWF:
          obj.type = "link";
          obj.className = "text-center";
          obj.format = (item: any) => {
            if (item[view.column]) {
              return `<i class='fa fa-file-image-o' aria-hidden='true'></i>`;
            } else {
              return "";
            }
          };
          obj.click = (item) => {
            this.modal.create({
              nzWrapClassName: "modal-lg modal-body-nopadding",
              nzStyle: { top: "40px" },
              nzMaskClosable: true,
              nzKeyboard: true,
              nzFooter: null,
              nzTitle: "查看",
              nzContent: ViewTypeComponent,
              nzComponentParams: {
                value: item[view.column],
                view: view
              }
            });
          };
          break;
        case ViewType.ATTACHMENT_DIALOG:
          obj.type = "link";
          obj.className = "text-center";
          obj.format = (item: any) => {
            if (item[view.column]) {
              return `<i class='fa fa-dot-circle-o' aria-hidden='true'></i>`;
            } else {
              return "";
            }
          };
          obj.click = (item) => {
            this.modal.create({
              nzWrapClassName: "modal-lg modal-body-nopadding",
              nzStyle: { top: "30px" },
              nzKeyboard: true,
              nzFooter: null,
              nzContent: ViewTypeComponent,
              nzComponentParams: {
                value: item[view.column],
                view: view
              }
            });
          };
          break;
        case ViewType.DOWNLOAD:
          obj.type = "link";
          obj.className = "text-center";
          obj.format = (item: any) => {
            if (item[view.column]) {
              return `<i class='fa fa-download' aria-hidden='true'></i>`;
            } else {
              return "";
            }
          };
          obj.click = (item) => {
            window.open(DataService.downloadAttachment(item[view.column]));
          };
          break;
        case ViewType.ATTACHMENT:
          obj.type = "link";
          obj.className = "text-center";
          obj.format = (item: any) => {
            if (item[view.column]) {
              return `<i class='fa fa-window-restore' aria-hidden='true'></i>`;
            } else {
              return "";
            }
          };
          obj.click = (item) => {
            window.open(DataService.previewAttachment(item[view.column]));
          };
          break;
      }

      if (view.template) {
        obj.format = (item: any) => {
          if (item[view.column]) {
            return eval(view.template);
          } else {
            return "";
          }
        };
      }
      if (view.className) {
        obj.className += " " + view.className;
      }
      cols.push(obj);
    }
    return cols;
  }


  private createViewType() {

  }


  //非空验证
  validateNotNull(eruptModel: EruptModel, combineErupt?: { [key: string]: EruptModel }): boolean {
    for (let field of eruptModel.eruptFieldModels) {
      if (field.eruptFieldJson.edit.notNull) {
        if (!field.eruptFieldJson.edit.$value) {
          this.msg.error(field.eruptFieldJson.edit.title + "必填！");
          return false;
        }
      }
    }
    if (combineErupt) {
      for (let key in combineErupt) {
        if (!this.validateNotNull(combineErupt[key])) {
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
  eruptValueToObject(eruptBuildModel: EruptBuildModel): object {
    const eruptData: any = {};
    eruptBuildModel.eruptModel.eruptFieldModels.forEach(field => {
      const edit = field.eruptFieldJson.edit;
      switch (edit.type) {
        case EditType.INPUT:
          if (edit.search.vague && eruptBuildModel.eruptModel.mode == "search") {
            if (field.fieldReturnName === "number") {
              if (edit.$l_val && edit.$r_val) {
                eruptData[field.fieldName] = [edit.$l_val, edit.$r_val];
              }
            } else {
              if (edit.$value) {
                eruptData[field.fieldName] = edit.$value;
              }
            }
          } else {
            if (edit.$value) {
              const inputType = edit.inputType;
              if (inputType.prefixValue || inputType.suffixValue) {
                eruptData[field.fieldName] = (inputType.prefixValue || "") + edit.$value + (inputType.suffixValue || "");
              } else {
                eruptData[field.fieldName] = edit.$value;
              }
            }
          }
          break;
        case EditType.CHOICE:
          if (edit.$value) {
            if (edit.choiceType.type === ChoiceEnum.SELECT_MULTI || edit.choiceType.type === ChoiceEnum.TAGS) {
              let val = (<string[]>edit.$value).join(edit.choiceType.joinSeparator);
              if (val) {
                eruptData[field.fieldName] = val;
              }
            } else {
              eruptData[field.fieldName] = edit.$value;
            }
          } else {
            eruptData[field.fieldName] = null;
          }
          break;
        case EditType.REFERENCE_TREE:
          if (edit.$value) {
            eruptData[field.fieldName] = {};
            eruptData[field.fieldName][edit.referenceTreeType.id] = edit.$value;
          } else {
            edit.$value = null;
          }
          break;
        case EditType.REFERENCE_TABLE:
          if (edit.$value) {
            eruptData[field.fieldName] = {};
            eruptData[field.fieldName][edit.referenceTableType.id] = edit.$value;
          } else {
            edit.$value = null;
          }
          break;
        case EditType.TAB_TREE:
          const tabTree = eruptData[field.fieldName] = [];
          if (edit.$value) {
            (<any[]>edit.$value).forEach(val => {
              const obj = {};
              obj[eruptBuildModel.tabErupts[field.fieldName].eruptJson.primaryKeyCol] = val;
              tabTree.push(obj);
            });
          }
          break;
        case EditType.ATTACHMENT:
          if (edit.attachmentType.saveMode === SaveMode.SINGLE_COLUMN) {
            if (edit.$viewValue) {
              const $value: string[] = [];
              (<UploadFile[]>edit.$viewValue).forEach(val => {
                $value.push(val.response.data);
              });
              eruptData[field.fieldName] = $value.join(edit.attachmentType.fileSeparator);
            }
          } else {
            this.msg.warning("该模式暂不可用");
          }
          break;
        case EditType.BOOLEAN:
          eruptData[field.fieldName] = edit.$value;
          break;
        default:
          if (edit.$value) {
            eruptData[field.fieldName] = edit.$value;
          }
          break;
      }
    });
    if (eruptBuildModel.combineErupts) {
      for (let key in eruptBuildModel.combineErupts) {
        eruptData[key] = this.eruptValueToObject({
          eruptModel: eruptBuildModel.combineErupts[key]
        });
      }
    }
    return eruptData;
  }

  //将后台数据转化成前端可视格式
  objectToEruptValue(object: any, eruptBuild: EruptBuildModel) {
    this.emptyEruptValue(eruptBuild);
    for (let field of eruptBuild.eruptModel.eruptFieldModels) {
      switch (field.eruptFieldJson.edit.type) {
        case EditType.INPUT:
          const inputType = field.eruptFieldJson.edit.inputType;
          //处理前缀和后缀的数据
          if (inputType.prefix.length > 0 || inputType.suffix.length > 0) {
            if (object[field.fieldName]) {
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
            }
          } else {
            field.eruptFieldJson.edit.$value = object[field.fieldName];
          }
          break;
        case EditType.DATE:
          field.eruptFieldJson.edit.$value = new FormControl(object[field.fieldName]).value;
          break;
        case EditType.REFERENCE_TREE:
          if (object[field.fieldName]) {
            field.eruptFieldJson.edit.$value = object[field.fieldName][field.eruptFieldJson.edit.referenceTreeType.id];
            field.eruptFieldJson.edit.$viewValue = object[field.fieldName][field.eruptFieldJson.edit.referenceTreeType.label];
          }
          break;
        case EditType.REFERENCE_TABLE:
          if (object[field.fieldName]) {
            field.eruptFieldJson.edit.$value = object[field.fieldName][field.eruptFieldJson.edit.referenceTableType.id];
            field.eruptFieldJson.edit.$viewValue = object[field.fieldName][field.eruptFieldJson.edit.referenceTableType.label];
          }
          break;
        case EditType.BOOLEAN:
          if (!object[field.fieldName] && object[field.fieldName] !== false) {
            field.eruptFieldJson.edit.$value = field.eruptFieldJson.edit.boolType.defaultValue;
          } else {
            field.eruptFieldJson.edit.$value = object[field.fieldName];
          }
          break;
        case EditType.ATTACHMENT:
          if (field.eruptFieldJson.edit.attachmentType.saveMode === SaveMode.SINGLE_COLUMN) {
            field.eruptFieldJson.edit.$viewValue = [];
            if (object[field.fieldName]) {
              (<string>object[field.fieldName]).split(field.eruptFieldJson.edit.attachmentType.fileSeparator)
                .forEach(str => {
                  (<UploadFile[]>field.eruptFieldJson.edit.$viewValue).push({
                    uid: str,
                    name: str,
                    size: 1,
                    type: "",
                    url: DataService.previewAttachment(str),
                    response: {
                      data: str
                    }
                  });
                });
              field.eruptFieldJson.edit.$value = object[field.fieldName];
            }
          } else {
            this.msg.warning("该功能尚未实现");
          }
          break;
        case EditType.CHOICE:
          if (field.eruptFieldJson.edit.choiceType.type === ChoiceEnum.SELECT_MULTI || field.eruptFieldJson.edit.choiceType.type === ChoiceEnum.TAGS) {
            if (object[field.fieldName]) {
              field.eruptFieldJson.edit.$value = String(object[field.fieldName]).split(field.eruptFieldJson.edit.choiceType.joinSeparator);
            } else {
              field.eruptFieldJson.edit.$value = [];
            }
          } else {
            if (object[field.fieldName]) {
              field.eruptFieldJson.edit.$value = object[field.fieldName] + "";
            }
          }
          break;
        default:
          field.eruptFieldJson.edit.$value = object[field.fieldName];
          break;
      }
    }
    if (eruptBuild.combineErupts) {
      for (let key in eruptBuild.combineErupts) {
        this.objectToEruptValue(object[key], { eruptModel: eruptBuild.combineErupts[key] });
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
    this.objectToEruptValue(obj, { eruptModel: eruptModel });
  }

  emptyEruptValue(eruptBuildModel: EruptBuildModel) {
    eruptBuildModel.eruptModel.eruptFieldModels.forEach(ef => {
      ef.eruptFieldJson.edit.$value = null;
      ef.eruptFieldJson.edit.$viewValue = null;
      ef.eruptFieldJson.edit.$tempValue = null;
      ef.eruptFieldJson.edit.$l_val = null;
      ef.eruptFieldJson.edit.$r_val = null;
      if (ef.eruptFieldJson.edit.type == EditType.BOOLEAN && eruptBuildModel.eruptModel.mode !== "search") {
        ef.eruptFieldJson.edit.$value = ef.eruptFieldJson.edit.boolType.defaultValue;
      } else if (ef.eruptFieldJson.edit.type == EditType.INPUT) {
        ef.eruptFieldJson.edit.inputType.prefixValue = null;
        ef.eruptFieldJson.edit.inputType.suffixValue = null;
      }
    });
  }


}