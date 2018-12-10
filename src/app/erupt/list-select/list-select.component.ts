import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {EruptFieldModel, ReferenceType} from "../model/erupt-field.model";

@Component({
    selector: 'app-list-select',
    templateUrl: './list-select.component.html',
    styles: []
})
export class ListSelectComponent implements OnInit {

    @Input() list: Array<ReferenceType>;

    @Input() eruptField: EruptFieldModel;



    constructor() {
    }

    ngOnInit() {
    }

}
