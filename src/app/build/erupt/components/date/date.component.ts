import {Component, Input, OnInit} from '@angular/core';
import {Edit, EruptFieldModel} from "../../model/erupt-field.model";
import {DateEnum, PickerMode} from "../../model/erupt.enum";
import {DatePipe} from "@angular/common";
import {DisabledDateFn, NzDateMode, PresetRanges} from "ng-zorro-antd/date-picker";
import moment from 'moment';
import {I18NService} from "@core";

@Component({
    standalone: false,
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
        this.init();
    }

    init() {
        this.startToday = moment().startOf('day').toDate();
        this.endToday = moment().endOf('day').toDate();
        const fmt = (d: moment.Moment, time: string) =>
            d.format(`YYYY-MM-DD`) + `T${time}`;
        this.dateRanges = <any>{
            [this.i18n.fanyi("global.today")]: [
                fmt(moment(), '00:00:00'),
                fmt(moment(), '23:59:59')
            ],
            [this.i18n.fanyi("global.yesterday")]: [
                fmt(moment().subtract(1, 'day'), '00:00:00'),
                fmt(moment().subtract(1, 'day'), '23:59:59')
            ],
            [this.i18n.fanyi("global.date.last_7_day")]: [
                fmt(moment().subtract(7, 'day'), '00:00:00'),
                fmt(moment(), '23:59:59')
            ],
            [this.i18n.fanyi("global.date.last_30_day")]: [
                fmt(moment().subtract(30, 'day'), '00:00:00'),
                fmt(moment(), '23:59:59')
            ],
            [this.i18n.fanyi("global.date.this_month")]: [
                fmt(moment().startOf('month'), '00:00:00'),
                fmt(moment(), '23:59:59')
            ],
            [this.i18n.fanyi("global.date.last_month")]: [
                fmt(moment().subtract(1, 'month').startOf('month'), '00:00:00'),
                fmt(moment().subtract(1, 'month').endOf('month'), '23:59:59')
            ],
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
