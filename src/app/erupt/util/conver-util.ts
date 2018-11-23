import {View} from "../model/erupt-field.model";
import {EruptModel} from "../model/erupt.model";
import {EditType, ViewType} from "../model/erupt.enum";
import {FormControl} from "@angular/forms";
/**
 * Created by liyuepeng on 10/31/18.
 */

//将eruptModel中的列全部取出，组成结构性的查询串
export function eruptModelConvertViewKeys(eruptModel: EruptModel): Array<View> {
  const views: Array<View> = [];
  eruptModel.eruptFieldModels.forEach(subField => {
    subField.eruptFieldJson.views.forEach(view => {
      if (!view.show) {
        return;
      }
      if (view.column) {
        view.column = subField.fieldName + "_" + view.column.replace("\.", "_");
      } else {
        view.column = subField.fieldName;
      }
      view.eruptFieldModel = subField;
      views.push(view);
    });
  });
  return views;
}

//将view数据转换为alain table组件配置信息
export function viewToAlainTableConfig(views: Array<View>): Array<any> {
  let cols = [];
  for (let view of views) {
    let edit = view.eruptFieldModel.eruptFieldJson.edit;
    let obj: any = {
      title: view.title,
      index: view.column
    };
    if (edit.type === EditType.BOOLEAN) {
      obj.type = 'yn';
    } else if (edit.type === EditType.CHOICE) {
      // obj.format = (item: any) => {
      //   return item[view.column] && view.edit.choiceType[0].vlMap[item[view.column]];
      // };
    }

    if (view.eruptFieldModel.fieldReturnName === "Integer"
      || view.eruptFieldModel.fieldReturnName === "Float"
      || view.eruptFieldModel.fieldReturnName === "Double") {
      obj.type = 'number';
    }

    if (view.viewType === ViewType.LINK) {
      obj.type = 'link';
    }

    if (view.template) {
      obj.format = (item: any) => {
        return view.template.replace("@txt@", item[view.column] || '');
      };
    }
    if (view.className) {
      obj.className = view.className;
      console.log(obj.className);
    }

    cols.push(obj);
  }
  console.log(cols);
  return cols;
}

//将eruptModel中的内容拼接成后台需要的json格式
export function eruptValueToObject(eruptModel: EruptModel): any {
  const eruptData: any = {};
  eruptModel.eruptFieldModels.forEach(field => {
    if (field.eruptFieldJson.edit.type === EditType.REFERENCE) {
      eruptData[field.fieldName] = {};
      eruptData[field.fieldName][field.eruptFieldJson.edit.referenceType[0].id] = field.eruptFieldJson.edit.$value;
    } else {
      eruptData[field.fieldName] = field.eruptFieldJson.edit.$value;
    }
  });
  return eruptData;
}

//将后台数据转化成前端可视格式
export function objectToEruptValue(eruptModel: EruptModel, object: any) {
  eruptModel.eruptFieldModels.forEach(field => {
    switch (field.eruptFieldJson.edit.type) {
      case EditType.DATE:
        // console.log(new FormControl(object[field.fieldName]).value);
        field.eruptFieldJson.edit.$value = new FormControl(object[field.fieldName]).value;
        break;
      case EditType.REFERENCE:
        field.eruptFieldJson.edit.$value = object[field.eruptFieldJson.edit.referenceType[0].id];
        field.eruptFieldJson.edit.$viewValue = object[field.eruptFieldJson.edit.referenceType[0].label];
        console.log(field.eruptFieldJson.edit.$viewValue);
        break;
      default:
        field.eruptFieldJson.edit.$value = object[field.fieldName];
        break;
    }
  });
}

