import {Inject, Injectable} from '@angular/core';
import {Bi, DimType} from "../model/bi.model";
import {DatePipe} from "@angular/common";
import {NzMessageService} from "ng-zorro-antd/message";

@Injectable({
    providedIn: 'root'
})
export class HandlerService {

    constructor(@Inject(NzMessageService)
                private msg: NzMessageService) {
    }

    private datePipe: DatePipe = new DatePipe("zh-cn");


    buildDimParam(bi: Bi, tip: boolean = true, skipNotNull = false): object {
        let param = {};
        for (let dimension of bi.dimensions) {
            let val = dimension.$value;
            if (val) {
                switch (dimension.type) {
                    case DimType.DATE_RANGE:
                        if (!val[1]){
                            break;
                        }
                        val[0] = this.datePipe.transform(val[0], "yyyy-MM-dd'T'00:00:00.SSS");
                        val[1] = this.datePipe.transform(val[1], "yyyy-MM-dd'T'23:59:59.SSS");
                        break;
                    case DimType.DATETIME_RANGE:
                        if (!val[1]){
                            break;
                        }
                        val[0] = this.datePipe.transform(val[0], "yyyy-MM-dd'T'HH:mm:ss.SSS");
                        val[1] = this.datePipe.transform(val[1], "yyyy-MM-dd'T'HH:mm:ss.SSS");
                        break;
                    case DimType.DATE:
                        val = this.datePipe.transform(val, "yyyy-MM-dd");
                        break;
                    case DimType.DATETIME:
                        val = this.datePipe.transform(val, "yyyy-MM-dd'T'HH:mm:ss");
                        break;
                    case DimType.TIME:
                        val = this.datePipe.transform(val, "HH:mm:ss");
                        break;
                    case DimType.YEAR:
                        val = this.datePipe.transform(val, "yyyy");
                        break;
                    case DimType.MONTH:
                        val = this.datePipe.transform(val, "yyyy-MM");
                        break;
                    case DimType.WEEK:
                        val = this.datePipe.transform(val, "yyyy-ww");
                        break;
                }
            }
            if (dimension.notNull && !dimension.$value) {
                if (tip) {
                    this.msg.error(dimension.title + "必填");
                }
                if (!skipNotNull) {
                    return null;
                }
            }
            if (dimension.notNull && Array.isArray(dimension.$value)) {
                if (!dimension.$value[0] && !dimension.$value[1]) {
                    if (tip) {
                        this.msg.error(dimension.title + "必填");
                    }
                    if (!skipNotNull) {
                        return null;
                    }
                }
            }
            //赋值
            if (Array.isArray(val) && val.length == 0) {
                param[dimension.code] = null;
            } else {
                param[dimension.code] = val || null;
            }
        }
        return param;
    }
}
