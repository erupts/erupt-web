import {Component, Input, OnInit} from "@angular/core";
import {cloneDeep} from "lodash";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EditType, Scene} from "../../model/erupt.enum";
import {DataHandlerService} from "../../service/data-handler.service";
import {colRules} from "@shared/model/util.model";

// types that are layout or a collection rather than one value a row holds
const NOT_BATCHABLE = new Set<EditType>([
    EditType.DIVIDE, EditType.CALLOUT, EditType.BUTTON, EditType.EMPTY, EditType.TPL, EditType.GROUP,
    EditType.HIDDEN, EditType.COMBINE, EditType.MULTI_FORM,
    EditType.TAB_TREE, EditType.TAB_TABLE_ADD, EditType.TAB_TABLE_REFER
]);

/**
 * Batch edit: one field of every selected row set to the same value. The editor is the row
 * form's own erupt-edit-type fed a one-field model, exactly as the inline cell editor, so value
 * conversion and the reference pickers behave identically; the write goes through the batch
 * cell endpoint, which runs the cell edit pipeline per row.
 */
@Component({
    standalone: false,
    selector: "erupt-batch-edit",
    templateUrl: "./batch-edit.component.html"
})
export class BatchEditComponent implements OnInit {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() count: number = 0;

    fields: EruptFieldModel[] = [];

    fieldName: string = null;

    // single-field build model driving the editor; a clone, so the row form's own state is never touched
    model: EruptBuildModel = null;

    saving: boolean = false;

    Scene = Scene;

    col = colRules[1];

    constructor(private dataHandler: DataHandlerService) {
    }

    ngOnInit(): void {
        this.fields = this.eruptBuildModel.eruptModel.eruptFieldModels.filter(f => BatchEditComponent.batchable(f));
    }

    // the rules of a cell edit: a form field that opts in and is not read-only in the edit form
    static batchable(field: EruptFieldModel): boolean {
        const edit = field.eruptFieldJson.edit;
        if (!edit || !edit.show || !edit.title || NOT_BATCHABLE.has(edit.type)) {
            return false;
        }
        if (edit.readOnly?.edit || edit.cellEdit === false) {
            return false;
        }
        // a reference picker reads the field it depends on out of the model it is given,
        // and this editor is handed a one-field model
        const dependField = edit.type === EditType.REFERENCE_TREE
            ? edit.referenceTreeType?.dependField
            : edit.type === EditType.REFERENCE_TABLE ? edit.referenceTableType?.dependField : null;
        return !dependField;
    }

    pick(fieldName: string): void {
        const field = this.fields.find(f => f.fieldName === fieldName);
        if (!field) {
            this.model = null;
            return;
        }
        const clone: EruptFieldModel = cloneDeep(field);
        this.model = {
            eruptModel: {
                ...this.eruptBuildModel.eruptModel,
                eruptFieldModels: [clone]
            }
        } as EruptBuildModel;
        // the editor starts empty: the value typed here replaces whatever each row holds
        this.dataHandler.objectToEruptValue({}, this.model);
    }

    // the form's own value conversion, so dates, choices and prefixes behave identically
    value(): any {
        return this.dataHandler.eruptValueToObject(this.model)[this.fieldName] ?? null;
    }

}
