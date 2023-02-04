import {Component, Input, OnInit} from '@angular/core';
import {EruptFieldModel} from "../../model/erupt-field.model";

@Component({
    selector: 'erupt-search-se',
    templateUrl: './search-se.component.html',
    styleUrls: ['./search-se.component.less']
})
export class SearchSeComponent implements OnInit {

    @Input() field: EruptFieldModel;

    constructor() {
    }

    ngOnInit(): void {
    }

}
