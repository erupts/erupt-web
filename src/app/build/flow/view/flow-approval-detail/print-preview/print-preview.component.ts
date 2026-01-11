import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {FlowInstance, FlowInstanceTask} from "@flow/model/flow-instance.model";
import {EruptBuildModel} from "../../../../erupt/model/erupt-build.model";
import {EruptFieldModel} from "../../../../erupt/model/erupt-field.model";
import {NodeType} from "@flow/model/node.model";

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

    formFields: Array<{ label: string, value: string }> = [];

    constructor(private elementRef: ElementRef) {
    }

    ngOnInit() {
        this.buildFormFields();
    }

    // 构建表单字段列表
    private buildFormFields() {
        this.formFields = [];

        // 添加提交人
        this.formFields.push({
            label: '提交人',
            value: this.instance?.initiatorUser?.name || '-'
        });

        // 遍历表单字段
        if (this.eruptBuild?.eruptModel?.eruptFieldModels) {
            for (const field of this.eruptBuild.eruptModel.eruptFieldModels) {
                if (field.eruptFieldJson?.edit?.show) {
                    this.formFields.push({
                        label: field.eruptFieldJson.edit.title,
                        value: this.getFieldValue(field)
                    });
                }
            }
        }

        // 添加审批流程
        const completedTasks = this.tasks?.filter(t => t.completedAt) || [];
        if (completedTasks.length > 0) {
            const lastTask = completedTasks[completedTasks.length - 1];
            this.formFields.push({
                label: '审批流程',
                value: lastTask.assigneeUser?.name || '-'
            });
        }

        // 添加审批结果
        this.formFields.push({
            label: '审批结果',
            value: this.translateStatus(this.instance?.status)
        });
    }

    // 获取字段值
    private getFieldValue(field: EruptFieldModel): string {
        try {
            if (field.componentValue !== undefined && field.componentValue !== null) {
                return String(field.componentValue);
            }
            if (field.value !== undefined && field.value !== null) {
                return String(field.value);
            }
            return '-';
        } catch (e) {
            return '-';
        }
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
        const printContent = this.elementRef.nativeElement.querySelector('.print-preview-container');
        if (!printContent) {
            console.error('未找到打印内容');
            return;
        }

        // 创建一个新的窗口用于打印
        const printWindow = window.open('', '_blank', 'width=900,height=650');
        if (!printWindow) {
            console.error('无法打开打印窗口');
            return;
        }

        // 获取当前页面的所有样式
        const styles = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    // 跨域样式表可能无法访问
                    const link = styleSheet.href;
                    return link ? `@import url("${link}");` : '';
                }
            })
            .join('\n');

        // 构建打印页面的HTML
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>打印预览</title>
                <style>
                    ${styles}

                    /* 打印专用样式 */
                    @media print {
                        body {
                            margin: 0;
                            padding: 20px;
                        }
                        @page {
                            size: A4;
                            margin: 20mm;
                        }
                    }

                    /* 确保打印内容样式正确 */
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    }
                </style>
            </head>
            <body>
                ${printContent.outerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();

        // 等待内容加载完成后打印
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 250);
        };
    }

    protected readonly NodeType = NodeType;
}
