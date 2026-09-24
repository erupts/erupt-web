import {AfterViewInit, Component, OnDestroy, OnInit} from "@angular/core";
import {SettingsService} from "@delon/theme";
import {DataService} from "@shared/service/data.service";
import {SessionService} from "@shared/service/session.service";
import {EruptApiModel, Status} from "../../../../build/erupt/model/erupt-api.model";

// Full-window cover shown while the session is locked; the page underneath stays mounted
@Component({
    standalone: false,
    selector: "lock-screen",
    templateUrl: "./lock-screen.component.html",
    styleUrls: ["./lock-screen.component.less"]
})
export class LockScreenComponent implements OnInit, AfterViewInit, OnDestroy {

    pwd = "";

    error = "";

    loading = false;

    now = new Date();

    private clock: ReturnType<typeof setInterval>;

    constructor(public settings: SettingsService,
                private dataService: DataService,
                public session: SessionService) {
    }

    ngOnInit() {
        this.clock = setInterval(() => this.now = new Date(), 1000);
    }

    // The cover tints the top strip too: the installed app's title bar corners follow it
    // (index.html reads .lock-screen as one more mask), on the way in and on the way out
    ngAfterViewInit() {
        window["eruptSyncThemeColor"]?.();
    }

    ngOnDestroy() {
        clearInterval(this.clock);
        window["eruptSyncThemeColor"]?.();
    }

    unlock() {
        if (!this.pwd || this.loading) return;
        this.loading = true;
        this.error = "";
        // a refused check arrives as a normal body, or as the interceptor's rejection: same handling
        const refused = (api: EruptApiModel) => {
            this.loading = false;
            this.error = api?.message || "";
            this.pwd = "";
        };
        this.dataService.verifyPwd(this.pwd).subscribe({
            next: api => api.status === Status.SUCCESS ? this.session.unlock() : refused(api),
            error: refused
        });
    }

}
