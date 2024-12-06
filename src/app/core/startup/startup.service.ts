import {Inject, Injectable} from "@angular/core";
import {SettingsService, TitleService} from "@delon/theme";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

import {ICONS_AUTO} from "../../../style-icons-auto";
import {WindowModel} from "@shared/model/window.model";
import {GlobalKeys} from "@shared/model/erupt-const";
import {RestPath} from "../../build/erupt/model/erupt.enum";
import {EruptAppData, EruptAppModel} from "@shared/model/erupt-app.model";
import {NzIconService} from "ng-zorro-antd/icon";
import {ReuseTabService} from "@delon/abc/reuse-tab";
import {I18NService} from "../i18n/i18n.service";
import {R} from "../../build/erupt/model/erupt-api.model";
import {EruptTenantInfoData, TenantDomainInfo} from "../../build/erupt/model/erupt-tenant";
import {NzMessageService} from "ng-zorro-antd/message";


@Injectable()
export class StartupService {
    constructor(iconSrv: NzIconService,
                private reuseTabService: ReuseTabService,
                private titleService: TitleService,
                private settingSrv: SettingsService,
                private i18n: I18NService,
                @Inject(NzMessageService) private msg: NzMessageService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
        iconSrv.addIcon(...ICONS_AUTO);
    }

    async load(): Promise<any> {
        WindowModel.init();
        if (WindowModel.copyright) {
            console.group(WindowModel.title);
            console.log("%c" +
                "                               __      \n" +
                "                              /\\ \\__   \n" +
                "   __   _ __   __  __   _____ \\ \\ ,_\\  \n" +
                " /'__`\\/\\`'__\\/\\ \\/\\ \\ /\\ '__`\\\\ \\ \\/  \n" +
                "/\\  __/\\ \\ \\/ \\ \\ \\_\\ \\\\ \\ \\L\\ \\\\ \\ \\_ \n" +
                "\\ \\____\\\\ \\_\\  \\ \\____/ \\ \\ ,__/ \\ \\__\\\n" +
                " \\/____/ \\/_/   \\/___/   \\ \\ \\/   \\/__/\n" +
                "                          \\ \\_\\        \n" +
                "                           \\/_/          \n" +
                "https://www.erupt.xyz", "color:#2196f3;font-weight:800");
            console.groupEnd();
        }
        (window as any).eruptWebSuccess = true;
        let that = this;
        await new Promise<void>((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', RestPath.eruptApp);
            xhr.send();
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    setTimeout(() => {
                        if (window['SW']) {
                            window['SW'].stop();
                            window['SW'] = null;
                        }
                    }, 2000)
                    let eruptAppProp = <EruptAppModel>JSON.parse(xhr.responseText);
                    EruptAppData.put(eruptAppProp);
                    if (!!EruptAppData.get().properties["erupt-tenant"]) {
                        let domainInfoXhr = new XMLHttpRequest();
                        domainInfoXhr.open('GET', RestPath.domainInfo + "?host=" + location.host);
                        domainInfoXhr.send();
                        domainInfoXhr.onreadystatechange = () => {
                            if (domainInfoXhr.readyState == 4 && domainInfoXhr.status == 200) {
                                let tenantDomainInfo = (<R<TenantDomainInfo>>JSON.parse(domainInfoXhr.responseText)).data;
                                if (tenantDomainInfo) {
                                    WindowModel.config.title = tenantDomainInfo.name;
                                    WindowModel.config.logoText = tenantDomainInfo.name;
                                    EruptTenantInfoData.put(tenantDomainInfo);
                                    if (tenantDomainInfo.css) {
                                        const styleElement = document.createElement('style');
                                        styleElement.textContent = tenantDomainInfo.css;
                                        document.head.appendChild(styleElement);
                                    }
                                    if (tenantDomainInfo.js) {
                                        try {
                                            eval(tenantDomainInfo.js)
                                        } catch (e) {
                                            that.msg.error("tenant js err: " + e)
                                        }
                                    }
                                    WindowModel.init();
                                    EruptAppData.put(eruptAppProp);
                                }
                                resolve();
                            }
                        }
                    } else {
                        resolve();
                    }
                } else if (xhr.status !== 200) {
                    setTimeout(() => {
                        location.href = location.href.split("#")[0];
                    }, 3000);
                }
            };
        });
        //注入全局方法：token
        window[GlobalKeys.getAppToken] = () => {
            return this.tokenService.get();
        };
        if (WindowModel.eruptEvent) {
            WindowModel.eruptEvent.startup && WindowModel.eruptEvent.startup();
        }
        //路由复用
        this.settingSrv.layout['reuse'] = !!this.settingSrv.layout['reuse'];
        //表格边框
        this.settingSrv.layout['bordered'] = false !== this.settingSrv.layout['bordered'];
        //面包靴导航
        this.settingSrv.layout['breadcrumbs'] = false !== this.settingSrv.layout['breadcrumbs'];

        if (this.settingSrv.layout['reuse']) {
            this.reuseTabService.mode = 0;
            this.reuseTabService.excludes = [];
        } else {
            this.reuseTabService.mode = 2;
            this.reuseTabService.excludes = [/\d*/];
        }
        return new Promise((resolve) => {
            // 应用信息：包括站点名、描述、年份
            this.settingSrv.setApp({
                name: WindowModel.title,
                description: WindowModel.desc
            });
            // 设置页面标题的后缀
            this.titleService.suffix = WindowModel.title;
            this.titleService.default = "";
            {
                let locales = EruptAppData.get().locales;
                let localesObj = {};
                for (let key of locales) {
                    localesObj[key] = key;
                }
                let defaultLang = this.i18n.getDefaultLang();
                if (!localesObj[defaultLang]) {
                    defaultLang = locales[0]
                }
                this.settingSrv.setLayout('lang', defaultLang);
                this.i18n.use(defaultLang)
            }
            this.i18n.loadLangData(() => {
                resolve(null);
            })
        });
    }
}
