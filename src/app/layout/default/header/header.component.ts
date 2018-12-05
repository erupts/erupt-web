import {Component} from '@angular/core';
import {SettingsService} from '@delon/theme';
import * as screenfull from 'screenfull';

@Component({
    selector: 'layout-header',
    templateUrl: './header.component.html'
})
export class HeaderComponent {
    searchToggleStatus: boolean;

    isFullScreen: boolean = false;

    constructor(public settings: SettingsService) {
    }

    toggleCollapsedSidebar() {
        this.settings.setLayout('collapsed', !this.settings.layout.collapsed);
    }

    searchToggleChange() {
        this.searchToggleStatus = !this.searchToggleStatus;
    }

    toggleScreen() {
        if (screenfull.enabled) {
            screenfull.toggle();
            this.isFullScreen = !this.isFullScreen;
        }
    }
}
