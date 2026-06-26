import {AfterViewChecked, Component, ElementRef, Input, OnInit, Renderer2} from '@angular/core';
import {MultiChoiceEnum} from "../../model/erupt.enum";
import {EruptModel} from "../../model/erupt.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataHandlerService} from "../../service/data-handler.service";

@Component({
    standalone: false,
    selector: 'erupt-multi-choice',
    templateUrl: './multi-choice.component.html',
    styleUrls: ['./multi-choice.component.less']
})
export class MultiChoiceComponent implements OnInit, AfterViewChecked {

    @Input() eruptModel: EruptModel;

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() eruptField: EruptFieldModel;

    @Input() readonly: boolean = false;

    @Input() size: 'large' | 'small' | "default" = "default";

    @Input() eruptParentName: string;

    multiChoiceEnum = MultiChoiceEnum;

    constructor(private dataService: DataService,
                private el: ElementRef,
                private renderer: Renderer2,
                private dataHandlerService: DataHandlerService) {
    }

    ngOnInit(): void {
        if (this.eruptField.eruptFieldJson.edit.multiChoiceType.dependField) {
            this.eruptModel.eruptFieldModelMap.get(this.eruptField.eruptFieldJson.edit.multiChoiceType.dependField)
                .eruptFieldJson.edit.$valueSubject?.asObservable().subscribe(val => {
                this.dataService.findChoiceItemFilter(this.eruptModel.eruptName, this.eruptField.fieldName, this.getFormData(), this.eruptParentName).subscribe(data => {
                    this.eruptField.componentValue = data;
                    if (this.eruptField.eruptFieldJson.edit.$value) {
                        this.eruptField.eruptFieldJson.edit.$value = this.eruptField.eruptFieldJson.edit.$value.filter((value) => {
                            return this.eruptField.componentValue.some(cv => cv.value == String(value));
                        })
                    }
                })
            })
        }
    }

    ngAfterViewChecked(): void {
        this.applyTagColors();
    }

    applyTagColors(): void {
        if (this.eruptField.eruptFieldJson.edit.multiChoiceType.type === this.multiChoiceEnum.SELECT) {
            const selectElement = this.el.nativeElement.querySelector('.multi-choice-select');
            if (selectElement && this.eruptField.eruptFieldJson.edit.$value) {
                const tags = selectElement.querySelectorAll('.ant-select-selection-item');
                tags.forEach((tag: HTMLElement) => {
                    const content = tag.querySelector('.ant-select-selection-item-content');
                    if (content) {
                        const label = content.textContent?.trim();
                        const matchedItem = this.eruptField.componentValue?.find(vl => vl.label === label);
                        if (matchedItem?.color && !matchedItem.disable) {
                            this.renderer.setStyle(content, 'color', matchedItem.color);
                        }
                    }
                });
            }
        }
    }

    getFormData(): object {
        return this.eruptBuildModel
            ? this.dataHandlerService.eruptValueToObject(this.eruptBuildModel)
            : {};
    }

    isNumeric(str: string): boolean {
        return !isNaN(parseFloat(str)) && isFinite(parseFloat(str));
    }

    includes(arr: any[], ele: any) {
        if (arr) {
            return arr.some(item => item == ele)
        }
        return false;
    }

    onCheckChange(value: any, checked: boolean) {
        const values: any[] = this.eruptField.eruptFieldJson.edit.$value || [];
        if (checked) {
            if (!this.includes(values, value)) values.push(value);
        } else {
            const idx = values.findIndex(v => v == value);
            if (idx !== -1) values.splice(idx, 1);
        }
        this.eruptField.eruptFieldJson.edit.$value = [...values];
    }

    isAllChecked(): boolean {
        const items = this.eruptField.componentValue;
        const values = this.eruptField.eruptFieldJson.edit.$value;
        if (!items?.length || !values?.length) return false;
        return items.filter(v => !v.disable).every(v => this.includes(values, v.value));
    }

    isIndeterminate(): boolean {
        const items = this.eruptField.componentValue;
        const values = this.eruptField.eruptFieldJson.edit.$value;
        if (!items?.length || !values?.length) return false;
        return !this.isAllChecked() && items.some(v => this.includes(values, v.value));
    }

    toggleAll(checked: boolean) {
        if (checked) {
            this.eruptField.eruptFieldJson.edit.$value = this.eruptField.componentValue
                .filter(v => !v.disable)
                .map(v => this.isNumeric(v.value) ? parseInt(v.value) : v.value);
        } else {
            this.eruptField.eruptFieldJson.edit.$value = [];
        }
    }

    getValueColor(value: any): string {
        const item = this.eruptField.componentValue?.find(vl => {
            const vlValue = this.isNumeric(vl.value) ? parseInt(vl.value) : vl.value;
            return vlValue == value;
        });
        return item?.color || '';
    }

    protected readonly parseInt = parseInt;

}
