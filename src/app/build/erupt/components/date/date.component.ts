import {Component, Inject, Input, OnInit} from '@angular/core';
import {Edit, EruptFieldModel} from "../../model/erupt-field.model";
import {DateEnum, PickerMode} from "../../model/erupt.enum";
import {DatePipe} from "@angular/common";
import {DisabledDateFn} from "ng-zorro-antd/date-picker/standard-types";
import * as moment from 'moment';
import {ALAIN_I18N_TOKEN} from "@delon/theme";
import {I18NService} from "@core";

@Component({
    selector: 'erupt-date',
    templateUrl: './date.component.html',
    styles: []
})
export class DateComponent implements OnInit {

    @Input() size: 'large' | 'small';

    @Input() field: EruptFieldModel;

    @Input() range: boolean = false;

    @Input() readonly: boolean;

    edit: Edit;

    private datePipe: DatePipe = new DatePipe("zh-cn");

    dateRanges: object = {};

    dateEnum = DateEnum;

    startToday: Date;

    endToday: Date;

    constructor(@Inject(ALAIN_I18N_TOKEN) private i18n: I18NService) {

    }

    ngOnInit() {
        this.startToday = moment(moment().format("yyyy-MM-DD 00:00:00")).toDate();
        this.endToday = moment(moment().format("yyyy-MM-DD 23:59:59")).toDate();
        let obj = {};
        obj[this.i18n.fanyi("global.today")] = [this.datePipe.transform(new Date(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")];
        this.dateRanges = obj;
        this.edit = this.field.eruptFieldJson.edit;
    }

    disabledDate: DisabledDateFn = (date) => {
        if (this.edit.dateType.pickerMode == PickerMode.ALL) {
            return false;
        }
        if (this.edit.dateType.pickerMode == PickerMode.FUTURE) {
            return date.getTime() < this.startToday.getTime();
        } else if (this.edit.dateType.pickerMode == PickerMode.HISTORY) {

            return date.getTime() > this.endToday.getTime();
        }
    };


}
