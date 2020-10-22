import {Component, OnDestroy, OnInit} from '@angular/core';
import {CacheService} from "@delon/cache";
import {StatusServiceService} from "@shared/service/status-service.service";

@Component({
    selector: 'erupt-fill',
    templateUrl: './fill.component.html',
    styles: []
})
export class FillComponent implements OnInit, OnDestroy {


    constructor(private statusService: StatusServiceService) {
    }

    ngOnInit() {
        this.statusService.isFillLayout = true;
    }

    ngOnDestroy(): void {
        this.statusService.isFillLayout = false;
    }

}
