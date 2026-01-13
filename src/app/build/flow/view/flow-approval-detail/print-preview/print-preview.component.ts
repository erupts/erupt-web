import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {FlowInstance, FlowInstanceTask} from "@flow/model/flow-instance.model";
import {EruptBuildModel} from "../../../../erupt/model/erupt-build.model";
import {NodeType} from "@flow/model/node.model";
import printJS from 'print-js';

@Component({
    standalone: false,
    selector: 'flow-print-preview',
    templateUrl: './print-preview.component.html',
    styleUrls: ['./print-preview.component.less']
})
export class FlowPrintPreviewComponent implements OnInit {

    @Input() instance: FlowInstance;
    @Input() tasks: FlowInstanceTask[];
    @Input() eruptBuild: EruptBuildModel;

    constructor(private elementRef: ElementRef) {
    }

    ngOnInit() {
    }

    // 翻译状态
    private translateStatus(status: string): string {
        const statusMap: { [key: string]: string } = {
            'PENDING': '待审批',
            'APPROVED': '已通过',
            'REJECTED': '已拒绝',
            'CANCELLED': '已取消',
            'FINISHED': '已完成'
        };
        return statusMap[status] || status || '-';
    }

    // 打印方法 - 只打印当前组件的内容
    print() {
        printJS({
            printable: this.elementRef.nativeElement.querySelector('.print-preview-container'),
            type: 'html',
            targetStyles: ['*']
        });
    }

    protected readonly NodeType = NodeType;
}
