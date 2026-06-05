import {Component, OnInit} from "@angular/core";
import {SettingsService} from "@delon/theme";

const SIDEBAR_WIDTH_KEY = 'erupt_sidebar_width';
const DEFAULT_WIDTH = 200;
const MIN_WIDTH = 150;
const MAX_WIDTH = 400;

@Component({
    standalone: false,
    selector: "layout-sidebar",
    templateUrl: "./sidebar.component.html",
    styleUrls: ["./sidebar.component.less"]
})
export class SidebarComponent implements OnInit {

    resizing = false;

    private sidebarWidth = DEFAULT_WIDTH;

    constructor(public settings: SettingsService) {
    }

    ngOnInit(): void {
        const saved = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY), 10);
        if (saved >= MIN_WIDTH && saved <= MAX_WIDTH) {
            this.sidebarWidth = saved;
            this.applyWidth(saved);
        }
    }

    toggleCollapsedSidebar() {
        this.settings.setLayout("collapsed", !this.settings.layout.collapsed);
    }

    onResizeStart(e: MouseEvent) {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = this.sidebarWidth;
        this.resizing = true;

        const onMove = (ev: MouseEvent) => {
            const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + ev.clientX - startX));
            this.sidebarWidth = width;
            this.applyWidth(width);
        };

        const onUp = () => {
            this.resizing = false;
            localStorage.setItem(SIDEBAR_WIDTH_KEY, String(this.sidebarWidth));
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    private applyWidth(width: number) {
        document.documentElement.style.setProperty('--sidebar-width', width + 'px');
    }

}
