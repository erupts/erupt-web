import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {FlowInstance, FlowInstanceTask} from "@flow/model/flow-instance.model";
import {EruptBuildModel} from "../../../../erupt/model/erupt-build.model";
import {NodeType} from "@flow/model/node.model";
import printJS from 'print-js';
import {SettingsService} from "@delon/theme";
import {PrintSetting} from "@flow/model/flow.model";
import {FlowInstanceApiService} from "@flow/service/flow-instance-api.service";

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

    printContent: string;

    currentDate = new Date();

    constructor(private elementRef: ElementRef,
                protected settingsService: SettingsService,
                private flowInstanceApiService: FlowInstanceApiService,) {
    }

    ngOnInit() {
        if (this.instance.eruptFlowConfig.setting.printSetting == PrintSetting.CUSTOM) {
            this.flowInstanceApiService.print(this.instance.id).subscribe(res => {
                this.printContent = res.data;
            });
        }
    }

    // 打印方法 - 只打印当前组件的内容
    print() {
        printJS({
            printable: this.elementRef.nativeElement.querySelector('.print-preview-container'),
            type: 'html',
            targetStyles: ['*'],
            style: `
                * {
                    font-family: 'Heiti SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }
              `
        });
    }

    protected readonly NodeType = NodeType;
    protected readonly PrintSetting = PrintSetting;
}
