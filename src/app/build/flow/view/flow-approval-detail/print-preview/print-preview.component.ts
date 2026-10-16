import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {FlowInstance, FlowInstanceTask} from "@flow/model/flow-instance.model";
import {EruptBuildModel} from "../../../../erupt/model/erupt-build.model";
import {NodeType} from "@flow/model/node.model";
import {loadBuiltinPrintConfig, printElement, printPageCss} from "@shared/util/print.util";
import {BuiltinPrintConfig, PaperOrientation, PaperSize} from "@shared/model/erupt-print";
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

    printLoading: boolean = false;

    currentDate = new Date();

    // settings of the default layout, shared with the built-in print of erupt models
    config: BuiltinPrintConfig = loadBuiltinPrintConfig();

    constructor(private elementRef: ElementRef,
                protected settingsService: SettingsService,
                private flowInstanceApiService: FlowInstanceApiService) {
    }

    ngOnInit() {
        if (this.instance.eruptFlowConfig.setting.printSetting == PrintSetting.CUSTOM) {
            this.printLoading = true;
            this.flowInstanceApiService.print(this.instance.id).subscribe({
                next: res => {
                    this.printContent = res.data;
                    this.printLoading = false;
                },
                error: () => this.printLoading = false
            });
        }
    }

    // A custom layout keeps the page setup saved with its template; the default one follows the config bar
    print() {
        let css: string;
        if (this.instance.eruptFlowConfig.setting.printSetting == PrintSetting.CUSTOM) {
            const pc = this.instance.eruptFlowConfig.setting.printPageConfig;
            css = printPageCss(pc?.paperSize || PaperSize.A4, pc?.orientation || PaperOrientation.PORTRAIT,
                `${pc?.marginTop ?? 10}mm ${pc?.marginRight ?? 10}mm ${pc?.marginBottom ?? 10}mm ${pc?.marginLeft ?? 10}mm`);
        } else {
            css = printPageCss(this.config.paperSize, this.config.orientation, `${this.config.margin}mm`);
        }
        printElement(this.elementRef.nativeElement, css);
    }

    protected readonly NodeType = NodeType;
    protected readonly PrintSetting = PrintSetting;
}
