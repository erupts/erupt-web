import {Component, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../../../erupt/service/data.service";
import {NzFormatEmitEvent} from "ng-zorro-antd/tree";
import {EruptModel} from "../../../erupt/model/erupt.model";
import {objectToEruptValue} from "../../../erupt/util/conver-util";
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: 'app-tree',
    templateUrl: './tree.component.html',
    styles: []
})
export class TreeComponent implements OnInit {

    eruptName: string = "";

    eruptModel: EruptModel;


    constructor(private dataService: DataService,
                public route: ActivatedRoute) {
    }

    @ViewChild('treeCom') treeCom;
    searchValue;

    nodes: any = [];

    nzEvent(event: NzFormatEmitEvent): void {
        console.log(event, this.treeCom.getMatchedNodeList().map(v => v.title));
    }

    nodeClickEvent(event: NzFormatEmitEvent): void {
        objectToEruptValue(this.eruptModel, event.node.origin.data);
    }

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            console.log(params);
            this.eruptName = params.name;
        });

        this.dataService.getEruptBuild(this.eruptName).subscribe(erupt => {
            this.eruptModel = erupt;
        });

        this.dataService.queryEruptTreeData(this.eruptName).subscribe(tree => {
            console.log(tree);
            function gcZorroTree(nodes) {
                const tempNodes = [];
                nodes.forEach(node => {
                    let option: any = {
                        code: node.id,
                        title: node.label,
                        data: node.data
                    };
                    if (node.children.length > 0) {
                        tempNodes.push(option);
                        option.children = gcZorroTree(node.children);
                    } else {
                        option.isLeaf = true;
                        tempNodes.push(option);
                    }
                });
                return tempNodes;
            }
            if(tree){
                this.nodes = gcZorroTree(tree);
            }

        })
    }

}
