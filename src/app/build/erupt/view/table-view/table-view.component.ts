import {Component, EventEmitter, OnDestroy, OnInit, Output} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {SettingsService} from "@delon/theme";

@Component({
    selector: "erupt-table-view",
    templateUrl: "./table-view.component.html",
    styleUrls: ["./table-view.component.less"]
})
export class TableViewComponent implements OnInit, OnDestroy {

    constructor(public route: ActivatedRoute,
                public settingSrv: SettingsService) {
    }

    private router$: Subscription;

    public eruptName: string;

    ngOnInit() {
        this.router$ = this.route.params.subscribe(params => {
            this.eruptName = params["name"];
        });
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

}

