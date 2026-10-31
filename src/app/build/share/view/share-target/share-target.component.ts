import {Component, OnDestroy, OnInit} from "@angular/core";
import {StatusService} from "@shared/service/status.service";

/**
 * Full-screen host of the pages a share link opens that come from other modules (a report, a
 * dashboard, a canvas): the same frame the /fill layout gives them, without the admin chrome.
 */
@Component({
    standalone: false,
    selector: "erupt-share-target",
    template: `
        <div class="alain-default" style="height: 100%">
            <router-outlet></router-outlet>
        </div>
    `
})
export class ShareTargetComponent implements OnInit, OnDestroy {

    constructor(private statusService: StatusService) {
    }

    ngOnInit(): void {
        this.statusService.isFillLayout = true;
    }

    ngOnDestroy(): void {
        this.statusService.isFillLayout = false;
    }
}
