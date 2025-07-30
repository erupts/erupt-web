import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

export interface IconColorConfig {
    icon: string;
    color: string;
}

@Component({
    selector: 'app-icon-color-picker',
    templateUrl: './icon-color-picker.component.html',
    styleUrls: ['./icon-color-picker.component.less']
})
export class IconColorPickerComponent implements OnInit {

    @Input() selectedIcon: string;

    @Input() selectedColor: string;

    @Output() configChange = new EventEmitter<IconColorConfig>();

    // 预览选择的图标（在确认前不会应用到实际选择）
    previewIcon: string = 'fa fa-user';

    // 预览颜色（用于图标选择器中的预览）
    previewColor: string = '#1890ff';

    bgColors: string[] = [
        '#1890ff',
        '#52c41a',
        '#fa8c16',
        '#f5222d',
        '#722ed1',
        '#13c2c2',
        '#eb2f96',
        '#8c8c8c',
        '#096dd9',
        '#389e0d',
        '#d48806'
    ];

    icons: string[] = [
        'fa fa-user',
        'fa fa-credit-card',
        'fa fa-bell',
        'fa fa-folder',
        'fa fa-calendar',
        'fa fa-car',
        'fa fa-yen',
        'fa fa-legal',
        'fa fa-clock-o',
        'fa fa-file-text',
        'fa fa-users',
        'fa fa-exchange',
        'fa fa-bolt',
        'fa fa-map-marker',
        'fa fa-user-circle',
        'fa fa-user-times',
        'fa fa-file-text-o',
        'fa fa-plane',
        'fa fa-lightbulb-o',
        'fa fa-pie-chart',
        'fa fa-bullseye',
        'fa fa-sitemap',
        'fa fa-building',
        'fa fa-cog',
        'fa fa-search',
        'fa fa-trash',
        'fa fa-save',
        'fa fa-print',
        'fa fa-download',
        'fa fa-upload',
        'fa fa-share',
        'fa fa-check-circle',
        'fa fa-exclamation-triangle',
        'fa fa-times-circle',
        'fa fa-info-circle',
        'fa fa-question-circle',
        'fa fa-lock',
        'fa fa-unlock',
        'fa fa-eye',
        'fa fa-eye-slash'
    ];

    ngOnInit(): void {
        this.initPreview();
    }

    // 初始化预览
    initPreview(): void {
        this.previewIcon = this.selectedIcon;
        this.previewColor = this.selectedColor;
    }

    // 选择图标（预览）
    selectIcon(icon: string, event: Event): void {
        event.stopPropagation();
        this.previewIcon = icon;
    }

    // 选择颜色（预览）
    selectColor(color: string, event: Event): void {
        event.stopPropagation();
        this.previewColor = color;
    }

    // 确认选择
    confirmSelection(): void {
        const config: IconColorConfig = {
            icon: this.previewIcon,
            color: this.previewColor
        };
        this.configChange.emit(config);
    }

    // 取消选择
    cancelSelection(): void {
        this.previewIcon = this.selectedIcon;
        this.previewColor = this.selectedColor;
    }

    // 获取图标选项样式
    getIconOptionStyle(color: string): string {
        return `background-color: ${color}`;
    }

    // 获取预览图标样式
    getPreviewIconStyle(): string {
        return `background-color: ${this.previewColor}`;
    }
}
