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
                // If access is “read-only”, ignore whether the field is readonly, since read-only is a universal permission
                if (access === FormAccessEnum.READONLY) {
                    this.formAccesses[field.fieldName] = access;
                } else if (!field.eruptFieldJson.edit.readOnly.add) {
                    // For other permissions such as edit, required, and hidden, check the readOnly.add flag
                    // Only fields that are not readOnly.add can be changed to non-read-only permissions
                    if (access === FormAccessEnum.NOT_NULL) {
                        // The required permission also needs to consider the field type
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
