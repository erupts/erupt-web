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


import {NzConfigService} from "ng-zorro-antd/core/config";
import {applyHeaderColor} from "../../shared/util/theme.util";


@Injectable()
export class StartupService {
    constructor(iconSrv: NzIconService,
                private reuseTabService: ReuseTabService,
                private titleService: TitleService,
                private settingSrv: SettingsService,
                private i18n: I18NService,
                private nzConfigService: NzConfigService,
                @Inject(NzMessageService) private msg: NzMessageService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
        iconSrv.addIcon(...ICONS_AUTO);
    }

    // Site config supplies the default theme; a color the user picked in the
    // settings drawer (localStorage "theme-color") wins over it.
    private applyTheme(): void {
        const theme = {...(WindowModel.theme || {})};
        const savedColor = localStorage.getItem("theme-color");
        if (savedColor) {
            theme.primaryColor = savedColor;
        }
        if (Object.keys(theme).length > 0) {
            this.nzConfigService.set('theme', theme);
        }
        // User choice first, then the site config default (theme.headerColor)
        applyHeaderColor(localStorage.getItem("header-color") || theme.headerColor || null);
    }

    async load(): Promise<any> {
        WindowModel.init();
        this.applyTheme();
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
                                            new Function("eruptAppProp",tenantDomainInfo.js)(eruptAppProp)
                                        } catch (e) {
                                            that.msg.error("tenant js err: " + e)
                                        }
                                    }
                                    WindowModel.init();
                                    this.applyTheme();
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
                    }, 5000);
                }
            };
        });
        // Inject global method: token
        window[GlobalKeys.getAppToken] = () => {
            return this.tokenService.get();
        };
        if (WindowModel.eruptEvent) {
            WindowModel.eruptEvent.startup && WindowModel.eruptEvent.startup();
        }
        // Route reuse (multi-tab): a choice persisted from the settings drawer
        // wins; otherwise fall back to the site-config default
        // (eruptSiteConfig.tabReuse, off by default).
        this.settingSrv.layout['reuse'] = 'reuse' in this.settingSrv.layout
            ? !!this.settingSrv.layout['reuse']
            : !!WindowModel.config['tabReuse'];
        // Table border
        this.settingSrv.layout['bordered'] = false !== this.settingSrv.layout['bordered'];
        // Breadcrumb navigation
        this.settingSrv.layout['breadcrumbs'] = false !== this.settingSrv.layout['breadcrumbs'];

        if (this.settingSrv.layout['reuse']) {
            this.reuseTabService.mode = 0;
            this.reuseTabService.excludes = [];
        } else {
            this.reuseTabService.mode = 2;
            this.reuseTabService.excludes = [/\d*/];
        }
        return new Promise((resolve) => {
            // Application info: includes site name, description, and year
            this.settingSrv.setApp({
                name: WindowModel.title,
                description: WindowModel.desc
            });
            // Set the page title suffix
            if (WindowModel.title){
                this.titleService.suffix = WindowModel.title;
            }
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
