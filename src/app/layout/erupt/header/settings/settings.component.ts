import {Component, OnInit} from '@angular/core';
import {SettingsService} from "@delon/theme";
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
            this.toggleColorWeak(false);
        } else {
            this.reuseTabService.mode = 2;
            this.reuseTabService.excludes = [/\d*/];
        }
        this.settingSrv.setLayout('reuse', value);
    }

    toggleColorWeak(value: boolean) {
        this.settingSrv.setLayout("colorWeak", value)
        if (value) {
            document.body.classList.add("color-weak");
            this.changeReuse(false);
        } else {
            document.body.classList.remove("color-weak");
        }
    }

    toggleColorGray(value: boolean) {
        this.settingSrv.setLayout("colorGray", value)
        if (value) {
            document.body.classList.add("color-gray");
        } else {
            document.body.classList.remove("color-gray");
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
