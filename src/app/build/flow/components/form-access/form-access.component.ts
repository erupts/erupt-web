import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";
import {FormAccessEnum} from "@flow/model/flow.model";
import {EditType} from "../../../erupt/model/erupt.enum";
import {NodeType} from "@flow/model/node.model";

@Component({
    standalone: false,
    selector: 'app-form-access',
    templateUrl: './form-access.component.html',
    styleUrls: ['./form-access.component.less']
})
export class FormAccessComponent implements OnInit {

    @Input() eruptBuild: EruptBuildModel;

    @Input() formAccesses: Record<string, FormAccessEnum> = {};

    @Input() access: FormAccessEnum = FormAccessEnum.READONLY;

    @Input() nodeType: NodeType;

    protected readonly FormAccessEnum = FormAccessEnum;

    ngOnInit(): void {
    }

    setAllAccess(access: FormAccessEnum) {
        for (const field of this.eruptBuild.eruptModel.eruptFieldModels) {
            if (field.eruptFieldJson.edit.title && field.eruptFieldJson.edit.show) {
                if (this.nodeType != NodeType.START && access == FormAccessEnum.READ_WRITE && field.eruptFieldJson.edit.notNull) {
                    continue;
                }
                if (this.nodeType == NodeType.START && field.eruptFieldJson.edit.notNull && access != FormAccessEnum.NOT_NULL) {
                    continue
                }
                // 如果是“只读”，则不考虑是否 readonly，因为只读是通用的权限
                if (access === FormAccessEnum.READONLY) {
                    this.formAccesses[field.fieldName] = access;
                } else if (!field.eruptFieldJson.edit.readOnly.add) {
                    // 对于其他权限，如编辑、必填、隐藏，需要根据 readOnly.add 的情况来判断
                    // 只有非 readOnly.add 的字段可以修改为非只读权限
                    if (access === FormAccessEnum.NOT_NULL) {
                        // 必填权限还需要考虑字段类型
                        if (!(field.eruptFieldJson.edit.type == EditType.DIVIDE
                            || field.eruptFieldJson.edit.type == EditType.TPL
                            || field.eruptFieldJson.edit.type == EditType.EMPTY)) {
                            this.formAccesses[field.fieldName] = access;
                        }
                    } else {
                        this.formAccesses[field.fieldName] = access;
                    }
                }
            }
        }
    }

    protected readonly EditType = EditType;
    protected readonly NodeType = NodeType;
}
