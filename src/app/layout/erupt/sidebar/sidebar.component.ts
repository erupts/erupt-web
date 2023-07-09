import {Component, OnInit} from "@angular/core";
import {SettingsService} from "@delon/theme";

@Component({
    selector: "layout-sidebar",
    templateUrl: "./sidebar.component.html",
    styleUrls: ["./sidebar.component.less"]
})
export class SidebarComponent implements OnInit {

    constructor(public settings: SettingsService) {
    }

    ngOnInit(): void {

    }

    toggleCollapsedSidebar() {
        this.settings.setLayout("collapsed", !this.settings.layout.collapsed);
    }

}
