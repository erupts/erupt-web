import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TransferItem} from "ng-zorro-antd/transfer";
import {DataService} from "@shared/service/data.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {EruptFieldModel} from "../../model/erupt-field.model";

export interface TransferOption {
    key: any;
    title: string;
    description?: string;
    disabled?: boolean;
}

/**
 * Searchable two-list picker; the bound value is the array of selected keys.
 *
 * Two ways to feed it:
 * - EditType.TRANSFER: pass eruptBuildModel + eruptFieldModel, the component loads the related
 *   rows itself (same endpoint as CHECKBOX) and reads / writes edit.$value directly.
 * - MULTI_CHOICE with Type.TRANSFER: pass options + [(value)].
 */
@Component({
    standalone: false,
    selector: 'erupt-transfer',
    templateUrl: './transfer.component.html',
    styleUrls: ['./transfer.component.less']
})
export class TransferComponent implements OnInit {

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() eruptFieldModel: EruptFieldModel;

    @Input() eruptParentName: string;

    @Input() options: TransferOption[];

    @Input() value: any[];

    @Output() valueChange = new EventEmitter<any[]>();

    @Input() disabled: boolean = false;

    loading = false;

    // a stable stand-in for an unset value: a fresh [] per change-detection pass would defeat
    // the reference check below and rebuild the items every cycle, wiping nz-transfer's
    // checked state (select-all and the move buttons stop working)
    private static readonly EMPTY: any[] = [];

    // items are rebuilt only when the options or the value array is replaced, so an
    // external reset or a dependField reload shows up without extra wiring
    private optionsSrc: TransferOption[];

    private valueSrc: any[];

    private cache: TransferItem[];

    constructor(private dataService: DataService) {
    }

    ngOnInit() {
        if (!this.eruptFieldModel) return;
        this.loading = true;
        this.dataService.findCheckBox(this.eruptBuildModel.eruptModel.eruptName, this.eruptFieldModel.fieldName, this.eruptParentName).subscribe(result => {
            this.options = (result || []).map(c => ({key: c.id, title: c.label, description: c.remark}));
            this.loading = false;
        });
    }

    private get currentValue(): any[] {
        return (this.eruptFieldModel ? this.eruptFieldModel.eruptFieldJson.edit.$value : this.value) || TransferComponent.EMPTY;
    }

    get items(): TransferItem[] {
        const value = this.currentValue;
        if (!this.cache || this.optionsSrc !== this.options || this.valueSrc !== value) {
            this.optionsSrc = this.options;
            this.valueSrc = value;
            this.cache = (this.options || []).map(o => ({
                key: o.key,
                title: o.title,
                description: o.description,
                disabled: o.disabled,
                direction: value.some(v => v == o.key) ? 'right' : 'left'
            }));
        }
        return this.cache;
    }

    // nz-transfer has already flipped the moved items' direction when this fires
    onChange() {
        const selected = this.cache.filter(i => i.direction === 'right').map(i => i['key']);
        if (this.eruptFieldModel) {
            this.eruptFieldModel.eruptFieldJson.edit.$value = selected;
        } else {
            this.valueChange.emit(selected);
        }
    }

}
