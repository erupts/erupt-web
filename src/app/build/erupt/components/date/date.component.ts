import {Component, Input, OnInit} from '@angular/core';
import {Edit, EruptFieldModel} from "../../model/erupt-field.model";
import {DateEnum, PickerMode} from "../../model/erupt.enum";
import {DatePipe} from "@angular/common";
import {DisabledDateFn, NzDateMode, PresetRanges} from "ng-zorro-antd/date-picker/standard-types";
import * as moment from 'moment';
import {I18NService} from "@core";

@Component({
    selector: 'erupt-date',
    templateUrl: './date.component.html',
    styles: []
})
export class DateComponent implements OnInit {

    @Input() size: 'large' | 'small' | "default" = "default";

    @Input() field: EruptFieldModel;

    @Input() range: boolean = false;

    @Input() readonly: boolean;

    private datePipe: DatePipe;

    edit: Edit;

    dateRanges: PresetRanges = {};

    dateEnum = DateEnum;

    startToday: Date;

    endToday: Date;

    rangeMode: NzDateMode;

    constructor(private i18n: I18NService) {
        this.datePipe = i18n.datePipe;
    }

    ngOnInit() {
        this.startToday = moment(moment().format("yyyy-MM-DD 00:00:00")).toDate();
        this.endToday = moment(moment().format("yyyy-MM-DD 23:59:59")).toDate();
        this.dateRanges = <any>{
            [this.i18n.fanyi("global.today")]: [this.datePipe.transform(new Date(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")],
            [this.i18n.fanyi("global.yesterday")]: [this.datePipe.transform(moment().add(-1, 'day').toDate(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(moment().add(-1, 'day').toDate(), "yyyy-MM-dd 23:59:59")],
            [this.i18n.fanyi("global.date.last_7_day")]: [this.datePipe.transform(moment().add(-7, 'day').toDate(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")],
            [this.i18n.fanyi("global.date.last_30_day")]: [this.datePipe.transform(moment().add(-30, 'day').toDate(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")],
            [this.i18n.fanyi("global.date.this_month")]: [this.datePipe.transform(moment().toDate(), "yyyy-MM-01 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")],
            [this.i18n.fanyi("global.date.last_month")]: [this.datePipe.transform(moment().add(-1, 'month').toDate(), "yyyy-MM-01 00:00:00"), this.datePipe.transform(moment().add(-1, 'month').endOf("month").toDate(), "yyyy-MM-dd 23:59:59")]
        };
        this.edit = this.field.eruptFieldJson.edit;
        if (this.range) {
            switch (this.field.eruptFieldJson.edit.dateType.type) {
                case DateEnum.DATE:
                case DateEnum.DATE_TIME:
                    this.rangeMode = 'date'
                    break;
                case DateEnum.WEEK:
                    this.rangeMode = 'week'
                    break;
                case DateEnum.MONTH:
                    this.rangeMode = 'month'
                    break;
                case DateEnum.YEAR:
                    this.rangeMode = 'year'
                    break;
            }
        }
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
        return null;
    };


}
