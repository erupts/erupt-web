import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-st-progress',
    templateUrl: './st-progress.component.html'
})
export class StProgressComponent {


    @Input() value: number;


}
