import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {BiDataService} from "../../service/data.service";
import {Bi, Dimension, DimType, Reference} from "../../model/bi.model";
import {NzTreeNode} from "ng-zorro-antd/core/tree/nz-tree-base-node";
import {HandlerService} from "../../service/handler.service";
import {NzFormatEmitEvent, NzTreeBaseService} from "ng-zorro-antd/core/tree";
import {NzTreeComponent} from "ng-zorro-antd/tree";

@Component({
    selector: "erupt-reference-select",
    templateUrl: "./reference.component.html",
    styles: []
})
export class ReferenceComponent implements OnInit {

    @Input() dimension: Dimension;

    @Input() code: string;

    @Input() bi: Bi;

    searchValue: string;

    multiple: boolean;

    data: any[];

    loading: boolean = false;

    @ViewChild("tree", {static: false}) tree: NzTreeComponent;

    constructor(private dataService: BiDataService, private handlerService: HandlerService) {

    }

    ngOnInit() {
        this.multiple = (this.dimension.type === DimType.REFERENCE_MULTI || this.dimension.type === DimType.REFERENCE_TREE_MULTI);
        let isTree = (this.dimension.type == DimType.REFERENCE_TREE_MULTI || this.dimension.type == DimType.REFERENCE_TREE_RADIO);
        this.loading = true;

        this.dataService.getBiReference(this.code, this.dimension.id, this.handlerService.buildDimParam(this.bi, false, true)).subscribe((res) => {
            if (res) {
                if (isTree) {
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
                if (this.multiple) {
                    this.data = [{
                        key: null,
                        title: '全部',
                        expanded: true,
                        children: this.data,
                        all: true,
                    }];
                }

                //选中回显
                if (this.dimension.$value) {
                    switch (this.dimension.type) {
                        case DimType.REFERENCE:
                            this.data.forEach(e => {
                                if (e.key == this.dimension.$value) {
                                    e.selected = true;
                                }
                            });
                            break;
                        case DimType.REFERENCE_MULTI:
                            this.data[0].children.forEach((e) => {
                                if (this.dimension.$value.indexOf(e.key) != -1) {
                                    e.checked = true;
                                }
                            });
                            break;
                        case DimType.REFERENCE_TREE_RADIO:
                            this.findAllNode(this.data).forEach(e => {
                                if (e.key == this.dimension.$value) {
                                    e.selected = true;
                                }
                            });
                            break;
                        case DimType.REFERENCE_TREE_MULTI:
                            this.findAllNode(this.data).forEach(e => {
                                if (this.dimension.$value.indexOf(e.key) != -1) {
                                    e.checked = true;
                                }
                            });
                            break;
                    }
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

    confirmNodeChecked() {
        if (this.multiple) {
            let treeNodes: NzTreeNode[] = this.tree.getCheckedNodeList();
            let viewValues = [];
            let values = [];
            treeNodes.forEach(e => {
                if (e.origin.key) {
                    values.push(e.origin.key);
                    viewValues.push(e.origin.title);
                }
            });
            if (values.length + 1 === this.findAllNode(this.data).length) {
                this.dimension.$value = [];
            } else {
                this.dimension.$value = values;
            }
            this.dimension.$viewValue = viewValues.join(" | ");
        } else {
            if (this.tree.getSelectedNodeList().length > 0) {
                this.dimension.$viewValue = this.tree.getSelectedNodeList()[0].title;
                this.dimension.$value = this.tree.getSelectedNodeList()[0].key;
            }
        }
    }

    //递归获取所有选中的值
    findAllNode(treeNodes: NzTreeNode[], result: any[] = []) {
        treeNodes.forEach(node => {
            if (node.children) {
                this.findAllNode(node.children, result);
            }
            result.push(node);
        });
        return result;
    }

}
