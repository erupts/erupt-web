import {Component, OnInit} from '@angular/core';
import {SettingsService} from "@delon/theme";
import {ReuseTabService} from "@delon/abc";
import {bootloader} from "@angularclass/hmr";
import {NzMessageService, NzModalService} from "ng-zorro-antd";

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
        this.settingSrv.layout.dark = value;
        if (value) {
            document.body.className = "dark";
            this.changeReuse(false);
        } else {
            document.body.className = "";
        }
    }

    clear() {
        this.confirmServ.confirm({
            nzTitle: '确认要清理所有的本地缓存吗 ？',
            nzOnOk: () => {
                localStorage.clear();
                this.messageServ.success('清理完成 ！');
            }
        });
    }

}
