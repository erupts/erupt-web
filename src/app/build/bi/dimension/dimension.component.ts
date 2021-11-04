import {Component, Inject, Input, OnInit} from '@angular/core';
import {Bi, Dimension, DimType} from "../model/bi.model";
import {colRules} from "@shared/model/util.model";
import {NzModalService} from "ng-zorro-antd";
import {ReferenceComponent} from "../components/reference/reference.component";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {ALAIN_I18N_TOKEN} from "@delon/theme";
import {I18NService} from "@core";

@Component({
    selector: 'dimension',
    templateUrl: './dimension.component.html',
    styleUrls: ['./dimension.component.less'],
    styles: []
})
export class DimensionComponent implements OnInit {

    @Input() bi: Bi;

    col = colRules[3];

    dimType = DimType;

    constructor(@Inject(NzModalService) private modal: NzModalService) {
    }

    ngOnInit() {

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
