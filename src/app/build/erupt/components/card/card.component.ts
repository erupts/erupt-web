import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataService} from "@shared/service/data.service";
import {EruptModel} from "../../model/erupt.model";

@Component({
    selector: 'erupt-card',
    templateUrl: './card.component.html',
    styles: []
})
export class CardComponent implements OnInit {

    constructor(private dataService: DataService) {
    }

    @Input() eruptBuildModel: EruptBuildModel;

    ngOnInit() {
        let eruptModel = this.eruptBuildModel.eruptModel;
        this.dataService.queryEruptTableData(eruptModel.eruptName).subscribe(table => {
            console.log(table)
        });

    }

}
