import {View} from "../model/erupt-field.model";
import {EruptModel} from "../model/erupt.model";
import {EditType, ViewType} from "../model/erupt.enum";
import {FormControl} from "@angular/forms";
/**
 * Created by liyuepeng on 10/31/18.
 */

export function initErupt(eruptModel: EruptModel) {
    eruptModel.eruptJson.rowOperationMap = new Map();
    eruptModel.eruptJson.rowOperation.forEach(oper =>
        eruptModel.eruptJson.rowOperationMap.set(oper.code, oper)
    );
    eruptModel.tableColumns = [];
    eruptModel.eruptFieldModels.forEach(field => {
        if (field.eruptFieldJson.edit.type === EditType.CHOICE) {
            const vlMap = field.eruptFieldJson.edit.choiceType[0].vlMap = new Map();
            field.eruptFieldJson.edit.choiceType[0].vl.forEach(vl => {
                vlMap.set(vl.value + "", vl.label)
            })
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
            view.eruptFieldModel = field;
            eruptModel.tableColumns.push(view);
        });
    });
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

        if (view.sortable) {
            obj.sort = true;
        }

        //编辑类型
        if (edit.type === EditType.BOOLEAN) {
            obj.type = 'yn';
            obj.className = "text-center";
        } else if (edit.type === EditType.CHOICE) {
            obj.format = (item: any) => {
                return item[view.column] ? edit.choiceType[0].vlMap.get(item[view.column]) : '';
            };
        }

        //数据类型
        if (view.eruptFieldModel.fieldReturnName === "Integer"
            || view.eruptFieldModel.fieldReturnName === "Float"
            || view.eruptFieldModel.fieldReturnName === "Double") {
            obj.type = 'number';
        } else if (view.eruptFieldModel.fieldReturnName === "Date") {
            obj.type = 'date';
        }

        //展示类型
        if (view.viewType === ViewType.LINK) {
            obj.type = 'link';
            obj.click = (data) => {
                window.open(data[view.column])
            }
        } else if (view.viewType === ViewType.QR_CODE) {
            obj.className = "text-center";
            obj.buttons = [
                {
                    icon: 'qrcode',
                    click: (record: any, modal: any) => {
                        console.log(record[view.column]);
                    }
                }
            ];
            obj.format = (item: any) => {
                return '';
            };
        }

        if (view.template) {
            obj.format = (item: any) => {
                return view.template.replace("@txt@", item[view.column] || '');
            };
        }
        if (view.className) {
            obj.className += " " + view.className;
        }

        cols.push(obj);
    }
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
                field.eruptFieldJson.edit.$value = object[field.fieldName + "_" + field.eruptFieldJson.edit.referenceType[0].id];
                field.eruptFieldJson.edit.$viewValue = object[field.fieldName + "_" + field.eruptFieldJson.edit.referenceType[0].label];
                break;
            default:
                field.eruptFieldJson.edit.$value = object[field.fieldName];
                break;
        }
    });
}

