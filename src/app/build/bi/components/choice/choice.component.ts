import {Component, Input, OnInit} from '@angular/core';
import {Bi, Dimension, DimType, Reference} from "../../model/bi.model";
import {BiDataService} from "../../service/data.service";

@Component({
    selector: 'erupt-bi-choice',
    templateUrl: './choice.component.html',
    styles: [`
        label[nz-radio] {
            min-width: 120px;
            margin-right: 0;
            line-height: 32px;
        }

        label[nz-checkbox] {
            min-width: 120px;
            line-height: 32px;
            margin-left: 0;
        }
    `]
})
export class ChoiceComponent implements OnInit {

    @Input() dim: Dimension;

    @Input() bi: Bi;

    loading: boolean;

    dimType = DimType;

    data: Reference[];

    constructor(private dataService: BiDataService) {
    }

    ngOnInit() {
        this.loading = true;
        this.dataService.getBiReference(this.bi.code, this.dim.id, null).subscribe((res) => {
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
