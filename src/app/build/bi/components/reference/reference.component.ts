import {Component, Input, OnInit} from "@angular/core";
import {NzFormatEmitEvent} from "ng-zorro-antd";
import {BiDataService} from "../../service/data.service";
import {Dimension, DimType, Reference} from "../../model/bi.model";
import {Tree} from "../../../erupt/model/erupt.model";
import {NzTreeNode} from "ng-zorro-antd/core/tree/nz-tree-base-node";

@Component({
    selector: "erupt-reference-select",
    templateUrl: "./reference.component.html",
    styles: []
})
export class ReferenceComponent implements OnInit {

    @Input() dimension: Dimension;

    @Input() code: string;

    searchValue: string;

    multiple: boolean;

    data: any[];

    loading: boolean = false;

    constructor(private dataService: BiDataService) {

    }

    ngOnInit() {
        this.multiple = (this.dimension.type === DimType.REFERENCE_MULTI || this.dimension.type === DimType.REFERENCE_TREE_MULTI);
        this.loading = true;
        this.dataService.getBiReference(this.code, this.dimension.code, null).subscribe((res) => {
            if (res) {
                if (this.dimension.type == DimType.REFERENCE_TREE_MULTI || this.dimension.type == DimType.REFERENCE_TREE_RADIO) {
                    this.data = this.recursiveTree(res, null);
                } else {
                    let node: {
                        key: string,
                        title: string,
                        isLeaf: boolean
                    }[] = [];
                    res.forEach(r => {
                        node.push({
                            isLeaf: true,
                            key: r.id,
                            title: r.title
                        });
                    });
                    this.data = node;
                }
            } else {
                this.data = [];
            }
            this.loading = false;
        });
    }

    recursiveTree(items: Reference[], pid: any) {
        let result: any = [];
        items.forEach(item => {
            if (item.pid == pid) {
                let option: any = {
                    key: item.id,
                    title: item.title,
                    expanded: true,
                    children: this.recursiveTree(items, item.id),
                };
                option.isLeaf = !option.children.length;
                result.push(option);
            }
        });
        return result;
    }

    nodeClickEvent(event: NzFormatEmitEvent) {
        this.dimension.$viewValue = event.node.origin.title;
        this.dimension.$value = event.node.origin.key;
    }


    nodeCheck(event: NzFormatEmitEvent) {
        let viewValues = [];
        event.checkedKeys.forEach(e => {
            viewValues.push(e.origin.title);
        });
        this.dimension.$value = event.keys;
        this.dimension.$viewValue = viewValues.join(" | ");
    }

}
