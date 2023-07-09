import {Component, Input, OnInit} from '@angular/core';
import {Dimension} from "../../model/bi.model";

@Component({
    selector: 'bi-search-se',
    templateUrl: './search-se.component.html',
    styleUrls: ['./search-se.component.less']
})
export class SearchSeComponent implements OnInit {

    @Input() dimension: Dimension;

    constructor() {
    }

    ngOnInit(): void {
    }

}
