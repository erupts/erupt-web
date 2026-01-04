import {Component, Input} from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-st-progress',
    templateUrl: './st-progress.component.html'
})
export class StProgressComponent {


    @Input() value: number;


}
