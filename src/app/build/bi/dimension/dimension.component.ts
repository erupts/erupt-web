import {Component, Inject, Input, OnInit} from '@angular/core';
import {Dimension, DimType} from "../model/bi.model";
import {colRules} from "@shared/model/util.model";
import {TreeSelectComponent} from "../../erupt/components/tree-select/tree-select.component";
import {NzModalService} from "ng-zorro-antd";
import {ReferenceComponent} from "../components/reference.component";

@Component({
    selector: 'dimension',
    templateUrl: './dimension.component.html',
    styleUrls: ['./dimension.component.less'],
    styles: []
})
export class DimensionComponent implements OnInit {

    @Input() dimensions: Dimension[];

    @Input() col = colRules[3];

    dimType = DimType;

    constructor(@Inject(NzModalService) private modal: NzModalService,) {
    }

    ngOnInit() {

    }

    ref(dim: Dimension) {
        this.modal.create({
            nzWrapClassName: "modal-xs",
            nzKeyboard: true,
            nzStyle: {top: "30px"},
            nzTitle: dim.title,
            nzCancelText: "取消（ESC）",
            nzContent: ReferenceComponent,
            nzComponentParams: {
                dimension: dim
            },
            nzOnOk: (res) => {

            }
        });
    }

}
