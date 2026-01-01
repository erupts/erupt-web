import {Component, OnDestroy, OnInit} from '@angular/core';
import {StatusService} from "@shared/service/status.service";

@Component({
    standalone: false,
    selector: 'erupt-fill',
    templateUrl: './fill.component.html',
    styles: []
})
export class FillComponent implements OnInit, OnDestroy {


    constructor(private statusService: StatusService) {
    }

    ngOnInit() {
        this.statusService.isFillLayout = true;
    }

    ngOnDestroy(): void {
        this.statusService.isFillLayout = false;
    }

}
