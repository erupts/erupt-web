import {Component, Input, OnInit} from '@angular/core';
import {Dimension, DimType} from "../model/bi.model";
import {colRules} from "../../../erupt/model/util.model";

@Component({
    selector: 'dimension',
    templateUrl: './dimension.component.html',
    styleUrls: ['./dimension.component.less'],
    styles: []
})
export class DimensionComponent implements OnInit {

    @Input() dimensions: Dimension[];

    @Input() col = colRules[4];

    dimType = DimType;

    constructor() {
    }

    ngOnInit() {

    }

}
