import {Component, Input, OnInit} from '@angular/core';
import 'prismjs/prism.js';
import {EruptFieldModel} from "../../model/erupt-field.model";

@Component({
    selector: 'erupt-markdown',
    templateUrl: './markdown.component.html',
    styles: []
})
export class MarkdownComponent implements OnInit {

    @Input() eruptField: EruptFieldModel;

    constructor() {
    }

    ngOnInit() {
    }

}
