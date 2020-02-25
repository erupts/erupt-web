import {Component, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";

@Component({
    selector: "erupt-table",
    templateUrl: "./table-view.component.html",
    styleUrls: ["./table-view.component.less"]
})
export class TableViewComponent implements OnInit, OnDestroy {

    constructor(public route: ActivatedRoute) {
    }

    private router$: Subscription;

    public eruptName: string;

    ngOnInit() {
        this.router$ = this.route.params.subscribe(params => {
            this.eruptName = params.name;
        });
    }

    ngOnDestroy(): void {
        this.router$.unsubscribe();
    }

}

