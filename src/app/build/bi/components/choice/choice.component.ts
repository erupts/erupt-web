import {Component, Input, OnInit} from '@angular/core';
import {Bi, Dimension, DimType} from "../../model/bi.model";
import {BiDataService} from "../../service/data.service";

@Component({
    selector: 'erupt-bi-choice',
    templateUrl: './choice.component.html',
    styles: []
})
export class ChoiceComponent implements OnInit {

    @Input() dim: Dimension;

    @Input() bi: Bi;

    loading: boolean;

    dimType = DimType;
    data: { key: any, title: any }[];

    constructor(private dataService: BiDataService) {
    }

    ngOnInit() {
        this.loading = true;
        this.dataService.getBiReference(this.bi.code, this.dim.code, null).subscribe((res) => {
            this.data = res;
            this.loading = false;
        });
    }


    checkedChange(event) {
        this.dim.$value = event;
    }

    checkedChangeAll($event) {
        this.dim.$viewValue = $event;
        this.dim.$value = [];
    }

}
