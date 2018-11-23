import {Component, Input, OnInit} from '@angular/core';
import {EruptModel} from "../../../erupt/model/erupt.model";
import {DataService} from "../../../erupt/service/data.service";
import {EditType} from "../../../erupt/model/erupt.enum";
import {eruptModelConvertViewKeys, eruptValueToObject, objectToEruptValue} from "../../../erupt/util/conver-util";

@Component({
  selector: 'erupt-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit {

  @Input() eruptModel: EruptModel;

  @Input() set rowDataFun(data: any) {
    if (data) {
      this.rowData = data;
      objectToEruptValue(this.eruptModel, data);
    } else {
      objectToEruptValue(this.eruptModel, {});
    }
  }

  rowData: any;

  @Input() behavior: "add" | "edit";

  groups: Set<string> = new Set;

  editType = EditType;

  constructor(private dataService: DataService) {

  }

  ngOnInit() {
    /**
     * TAB control
     */
    for (const subErupt of this.eruptModel.subEruptModels) {
      if (this.rowData) {
        for (const subField of subErupt.eruptModel.eruptFieldModels) {
          if (subField.fieldReturnName === this.eruptModel.eruptName) {
            const condition: any = {};
            condition[subField.fieldName + "." + this.eruptModel.primaryKeyCol] = this.rowData[this.eruptModel.primaryKeyCol];
            this.dataService.queryEruptData(subErupt.eruptModel.eruptName, condition).subscribe(
              data => {
                subErupt.eruptField.eruptFieldJson.edit.$value = data.list;
              }
            );
            break;
          }
        }
      }
    }

    //计算里面所有的字段信息
    for (const field of this.eruptModel.eruptFieldModels) {
      if (field.eruptFieldJson.edit.type === EditType.TAB) {
        if (!field.eruptFieldJson.edit.tabType) {
          field.eruptFieldJson.edit.tabType = [];
        }
        field.eruptFieldJson.edit.tabType[0] = {};
        //tab表的结构
        this.dataService.getEruptBuild(field.fieldReturnName).subscribe(subErupt => {
          //tab表的数据
          if (this.rowData) {
            for (const sub of subErupt.eruptFieldModels) {
              if (sub.fieldReturnName === this.eruptModel.eruptName) {
                const condition: any = {};
                condition[sub.fieldName + "." + this.eruptModel.primaryKeyCol] = this.rowData[this.eruptModel.primaryKeyCol];
                this.dataService.queryEruptData(field.fieldReturnName, condition).subscribe(
                  data => {
                    field.eruptFieldJson.edit.$value = data.list;

                  }
                );
                break;
              }
            }
          }
          field.eruptFieldJson.edit.tabType[0].eruptFieldModels = subErupt.eruptFieldModels;
          field.eruptFieldJson.edit.tabType[0].views = eruptModelConvertViewKeys(subErupt);
        });

      }
      this.groups.add(field.eruptFieldJson.edit.group);
    }

  }

}
