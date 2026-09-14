import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

export interface IconColorConfig {
    icon: string;
    color: string;
}

@Component({
    standalone: false,
    selector: 'app-icon-color-picker',
    templateUrl: './icon-color-picker.component.html',
    styleUrls: ['./icon-color-picker.component.less']
})
export class IconColorPickerComponent implements OnInit {

    @Input() selectedIcon: string;

    @Input() selectedColor: string;

    @Output() configChange: EventEmitter<IconColorConfig> = new EventEmitter<IconColorConfig>();

    // Preview of the selected icon (not applied to the actual selection until confirmed)
    previewIcon: string = 'fa fa-user';

    // Preview color (used for the preview in the icon picker)
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


    ngOnInit(): void {
        this.initPreview();
    }

    // Initialize preview
    initPreview(): void {
        this.previewIcon = this.selectedIcon;
        this.previewColor = this.selectedColor;
    }

    // Select icon (preview); the full Font Awesome catalogue comes from erupt-icon-picker
    selectIcon(icon: string): void {
        this.previewIcon = icon;
    }

    // Select color (preview)
    selectColor(color: string, event: Event): void {
        event.stopPropagation();
        this.previewColor = color;
    }

    // Confirm selection
    confirmSelection(): void {
        const config: IconColorConfig = {
            icon: this.previewIcon,
            color: this.previewColor
        };
        this.configChange.emit(config);
    }

    // Cancel selection
    cancelSelection(): void {
        this.previewIcon = this.selectedIcon;
        this.previewColor = this.selectedColor;
    }

    // Get icon option style
    getIconOptionStyle(color: string): string {
        return `background-color: ${color}`;
    }

    // Get preview icon style
    getPreviewIconStyle(): string {
        return `background-color: ${this.previewColor}`;
    }
}
