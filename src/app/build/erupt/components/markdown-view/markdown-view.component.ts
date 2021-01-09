import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'erupt-markdown-view',
    templateUrl: './markdown-view.component.html',
    styles: []
})
export class MarkdownViewComponent implements OnInit {

    @Input() value: string;

    constructor() {
    }

    ngOnInit() {
    }

}
