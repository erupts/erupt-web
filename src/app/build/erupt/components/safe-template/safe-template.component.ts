import {AfterViewInit, Component, ElementRef, Input, OnInit} from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-safe-template',
    templateUrl: './safe-template.component.html',
    styles: []
})
export class SafeTemplateComponent implements AfterViewInit {

    @Input() html: string;

    loading: boolean = false;

    constructor(private ref: ElementRef) {
    }

    ngAfterViewInit(): void {

    }

}
