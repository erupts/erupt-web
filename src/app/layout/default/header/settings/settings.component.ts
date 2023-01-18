import {Component, Inject, OnInit} from '@angular/core';
import {ALAIN_I18N_TOKEN, SettingsService} from "@delon/theme";
import {I18NService} from "@core";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import {ReuseTabService} from "@delon/abc/reuse-tab";

@Component({
    selector: 'erupt-settings',
    templateUrl: './settings.component.html',
    styleUrls: ["./settings.component.less"],
    styles: []
})
export class SettingsComponent implements OnInit {

    constructor(private settingSrv: SettingsService,
                private confirmServ: NzModalService,
                private messageServ: NzMessageService,
                private i18n: I18NService,
                private reuseTabService: ReuseTabService) {
    }

    ngOnInit() {
    }

    setLayout(name: string, value: any) {
        this.settingSrv.setLayout(name, value);
    }

    get layout() {
        return this.settingSrv.layout;
    }

    changeReuse(value: boolean) {
        if (value) {
            this.reuseTabService.mode = 0;
            this.reuseTabService.excludes = [];
            this.toggleDark(false);
        } else {
            this.reuseTabService.mode = 2;
            this.reuseTabService.excludes = [/\d*/];
        }
        this.settingSrv.setLayout('reuse', value);
    }

    toggleDark(value: boolean) {
        this.settingSrv.layout['dark'] = value;
        if (value) {
            document.body.className = "dark";
            this.changeReuse(false);
        } else {
            document.body.className = "";
        }
    }

    clear() {
        this.confirmServ.confirm({
            // setting.ok
            nzTitle: this.i18n.fanyi("setting.confirm"),
            nzOnOk: () => {
                localStorage.clear();
                this.messageServ.success(this.i18n.fanyi("finish"));
            }
        });
    }

}
