import {Component, Inject, Input, OnInit} from '@angular/core';
import {Bi, Dimension, DimType} from "../model/bi.model";
import {colRules} from "@shared/model/util.model";
import {NzModalService} from "ng-zorro-antd";
import {ReferenceComponent} from "../components/reference/reference.component";
import {PresetRanges} from "ng-zorro-antd/date-picker/standard-types";
import * as moment from 'moment';
import {DatePipe} from "@angular/common";
import {ALAIN_I18N_TOKEN} from "@delon/theme";
import {I18NService} from "@core";

@Component({
    selector: 'bi-dimension',
    templateUrl: './dimension.component.html',
    styleUrls: ['./dimension.component.less'],
    styles: []
})
export class DimensionComponent implements OnInit {

    @Input() bi: Bi;

    col = colRules[3];

    dimType = DimType;

    dateRanges: PresetRanges = {};

    private datePipe: DatePipe = new DatePipe("zh-cn");

    constructor(@Inject(NzModalService) private modal: NzModalService, @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService) {
    }

    ngOnInit() {
        let obj = {};
        obj[this.i18n.fanyi("global.today")] = [this.datePipe.transform(new Date(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")];
        obj['近7天'] = [this.datePipe.transform(moment().add(-7, 'day').toDate(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")];
        obj['近30天'] = [this.datePipe.transform(moment().add(-30, 'day').toDate(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")];

        console.log(this.datePipe.transform(moment().add(-1, 'weeks').startOf('weeks').toDate(), "yyyy-MM-dd 00:00:00"));
        console.log(this.datePipe.transform(moment().add(-1, 'weeks').endOf('weeks').toDate(), "yyyy-MM-dd 23:59:59"));
        // obj['本周'] = [this.datePipe.transform(moment().add(-7, 'day').toDate(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")];
        // obj['上周'] = [this.datePipe.transform(moment().add(-7, 'day').toDate(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")];
        obj['本月'] = [this.datePipe.transform(moment().toDate(), "yyyy-MM-01 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")];
        obj['上月'] = [this.datePipe.transform(moment().add(-1, 'month').toDate(), "yyyy-MM-01 00:00:00"), this.datePipe.transform(moment().add(-1, 'month').endOf("month").toDate(), "yyyy-MM-dd 23:59:59")];
        // obj[this.i18n.fanyi("global.all")] = [this.datePipe.transform(new Date(), "yyyy-MM-dd 00:00:00"), this.datePipe.transform(new Date(), "yyyy-MM-dd 23:59:59")];
        this.dateRanges = obj;
    }

    ref(dim: Dimension) {
        this.modal.create({
            nzWrapClassName: "modal-xs",
            nzKeyboard: true,
            nzStyle: {top: "30px"},
            nzTitle: dim.title,
            nzContent: ReferenceComponent,
            nzComponentParams: {
                dimension: dim,
                code: this.bi.code,
                bi: this.bi
            },
            nzOnOk: (res) => {

            }
        });
    }

    clearRef(dim: Dimension) {
        dim.$viewValue = null;
        dim.$value = null;
    }

}
