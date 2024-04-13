import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Bi, Dimension, DimType} from "../../model/bi.model";
import {BiDataService} from "../../service/data.service";
import {STColumn, STComponent} from "@delon/abc/st";
import {SettingsService} from "@delon/theme";
import {STChange, STPage} from "@delon/abc/st/st.interfaces";

@Component({
    selector: 'bi-reference-table',
    templateUrl: './reference-table.component.html',
    styleUrls: ['./reference-table.component.less']
})
export class ReferenceTableComponent implements OnInit {

    @Input() dimension: Dimension;

    @Input() code: string;

    @Input() bi: Bi;

    @ViewChild("st", {static: false})
    st: STComponent;

    columns: STColumn[] = [];

    data: any;

    loading: boolean = false;

    clientWidth = document.body.clientWidth;

    radio: any;

    checkbox: any[];

    idColumn: string;

    labelColumn: string;

    biTable: {

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
        },
    };


    constructor(private dataService: BiDataService,
                public settingSrv: SettingsService) {

    }

    ngOnInit() {
        this.loading = true;
        this.dataService.getBiReferenceTable(this.code, this.dimension.id).subscribe((res) => {
            if (res) {
                this.loading = false;
                this.biTable.total = res.total;
                if (!res.columns) {
                    this.data = [];
                } else {
                    let columns = [];
                    let i = 0;
                    for (let column of res.columns) {
                        // let titleWidth = column.name.length * 14 + 22;
                        if (i == 0) {
                            columns.push(
                                {
                                    title: '#',
                                    index: column.name,
                                    type: this.dimension.type == DimType.REFERENCE_TABLE_MULTI ? 'checkbox' : 'radio',
                                    className: "text-center"
                                },
                            )
                            this.idColumn = column.name;
                        } else {
                            if (i == 1) {
                                this.labelColumn = column.name;
                            }
                            let col: STColumn = {
                                title: {
                                    text: column.name,
                                    optional: "   "
                                },
                                index: column.name,
                                className: "text-center",
                                filter: {
                                    type: 'keyword',
                                    placeholder: '输入后按回车搜索',
                                    fn: (filter, record) => {
                                        if (filter.value) {
                                            let val = record[column.name];
                                            if (val) {
                                                if (typeof val === 'number') {
                                                    return val == filter.value;
                                                }
                                                return val.indexOf(filter.value) !== -1
                                            } else {
                                                return false;
                                            }
                                        }
                                        return true;
                                    }
                                }
                            };
                            if (column.sortable) {
                                col.sort = {
                                    key: column.name,
                                    compare: (a: any, b: any) => {
                                        a = a[column.name];
                                        b = b[column.name];
                                        if (a === null) {
                                            return -1;
                                        }
                                        if (b === null) {
                                            return 1;
                                        }
                                        if (typeof a === "number" && typeof b === "number") {
                                            return a - b;
                                        }
                                        if (typeof a === "string" && typeof b === "string") {
                                            return a.localeCompare(b);
                                        }
                                        return 0;
                                    }
                                };
                            }
                            columns.push(col);
                        }
                        i++
                    }
                    this.columns = columns;
                    this.data = res.list;
                }
            }
        });
    }

    change(e: STChange): void {
        if (e.type === 'checkbox') {
            this.checkbox = e.checkbox;
        }
        if (e.type === 'radio') {
            this.radio = e.radio;
        }
    }

    confirmChecked() {
        if (this.dimension.type == DimType.REFERENCE_TABLE_RADIO) {
            this.dimension.$viewValue = this.radio[this.labelColumn];
            this.dimension.$value = this.radio[this.idColumn];
        } else if (this.dimension.type == DimType.REFERENCE_TABLE_MULTI) {
            let values = [];
            let names = [];
            for (let ck of this.checkbox) {
                values.push(ck[this.idColumn])
                names.push(ck[this.labelColumn])
            }
            this.dimension.$viewValue = names;
            this.dimension.$value = values;
        }
    }

}
