import {Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {Bi} from "../model/bi.model";
import {STColumn, STPage} from "@delon/abc/table/table.interfaces";
import {BiDataService} from "../service/data.service";
import {ActivatedRoute} from "@angular/router";
import {HandlerService} from "../service/handler.service";
import {SettingsService} from "@delon/theme";
import {NzMessageService} from "ng-zorro-antd";
import {STComponent} from "@delon/abc";

@Component({
    selector: 'erupt-drill',
    templateUrl: './drill.component.html',
    styles: []
})
export class DrillComponent implements OnInit {

    @Input() bi: Bi;

    @Input() drillCode: number;

    @Input() row: any;

    pageIndex: 0;

    pageSize: 10;

    name: string;

    querying: boolean = false;

    clientWidth = document.body.clientWidth;

    biTable: {

        data?: any,

        columns?: STColumn[],

        index: number;

        size: number;

        total: number;

        page: STPage;

        pageSizeOptions?: number[];

    } = {
        index: 1,

        size: 10,

        total: 0,

        page: {
            show: false
        }

    };

    @ViewChild("st", {static: false}) st: STComponent;

    constructor(private dataService: BiDataService,
                public route: ActivatedRoute,
                private handlerService: HandlerService,
                public settingSrv: SettingsService,
                @Inject(NzMessageService) private msg: NzMessageService) {
    }

    ngOnInit() {
        // delete this.row._values;
        this.dataService.getBiDrillData(this.bi.code, this.drillCode.toString(), 0, 10, this.row).subscribe(res => {
            this.querying = false;
            this.biTable.total = res.total;
            this.biTable.columns = [];
            if (!res.columns) {
                this.biTable.data = [];
            } else {
                for (let column of res.columns) {
                    if (column.display) {
                        let col: STColumn = {
                            title: column.name,
                            index: column.name,
                            className: "text-center",
                            width: column.width,
                            show: true,
                            iif: () => {
                                return col.show;
                            }
                        };
                        this.biTable.columns.push(col);
                    }
                }
                this.biTable.data = res.list;
            }
        });
    }

}
