import {Component, Input, OnInit} from "@angular/core";
import {BiDataService} from "../../service/data.service";
import {Bi, Dimension, Reference} from "../../model/bi.model";
import {HandlerService} from "../../service/handler.service";
import {I18NService} from "@core";

@Component({
    selector: "erupt-bi-cascade",
    templateUrl: "./cascade.component.html",
    styles: []
})
export class CascadeComponent implements OnInit {

    @Input() dim: Dimension;

    @Input() bi: Bi;

    loading: boolean = false;

    data: any;

    constructor(private dataService: BiDataService, private handlerService: HandlerService, private i18nService: I18NService) {

    }

    fanyi(key: string): string {
        return this.i18nService.fanyi("")
    }

    ngOnInit() {
        this.loading = true;
        this.dataService.getBiReference(this.bi.code, this.dim.id, this.handlerService.buildDimParam(this.bi, false, true))
            .subscribe((res) => {
                this.data = this.recursiveTree(res, null);
                this.data.forEach(e => {
                    if (e.key == this.dim.$value) {
                        e.selected = true;
                    }
                });
                this.loading = false;
            });
    }

    recursiveTree(items: Reference[], pid: any) {
        let result: any = [];
        items.forEach(item => {
            if (item.pid == pid) {
                let option: any = {
                    value: item.id,
                    label: item.title,
                    children: this.recursiveTree(items, item.id)
                };
                option.isLeaf = !option.children.length;
                result.push(option);
            }
        });
        return result;
    }

}
