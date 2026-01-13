import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {FlowInstance, FlowInstanceTask} from "@flow/model/flow-instance.model";
import {EruptBuildModel} from "../../../../erupt/model/erupt-build.model";
import {NodeType} from "@flow/model/node.model";
import printJS from 'print-js';
import {SettingsService} from "@delon/theme";

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

    currentDate = new Date();

    constructor(private elementRef: ElementRef, protected settingsService: SettingsService,) {
    }

    ngOnInit() {
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
