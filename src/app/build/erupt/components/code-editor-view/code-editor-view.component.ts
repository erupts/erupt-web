import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'code-editor-view',
    templateUrl: './code-editor-view.component.html',
    styles: []
})
export class CodeEditorViewComponent implements OnInit {

    @Input() language: string;

    @Input() value: string;

    constructor() {
    }

    ngOnInit() {
    }

    codeEditorInit(event) {
        event.setValue(this.value || '');
        console.log(event);
    }

}
