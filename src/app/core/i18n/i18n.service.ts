// 请参考：https://ng-alain.com/docs/i18n
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter} from 'rxjs/operators';

import {registerLocaleData} from '@angular/common';
import ngZh from '@angular/common/locales/zh';
import ngEn from '@angular/common/locales/en';
import ngKO from '@angular/common/locales/ko';
import ngJA from '@angular/common/locales/ja';
import ngZhTw from '@angular/common/locales/zh-Hant-HK';

import {NzI18nService, en_US, zh_CN, ko_KR, ja_JP, zh_TW} from 'ng-zorro-antd';
import * as df_en from 'date-fns/locale/en';
import * as df_zh_cn from 'date-fns/locale/zh_cn';
import * as df_ko from 'date-fns/locale/ko';
import * as df_zh_tw from 'date-fns/locale/zh_tw';
import * as df_ja from 'date-fns/locale/ja';

import {TranslateService} from '@ngx-translate/core';
import {
    AlainI18NService, DelonLocaleService,
    en_US as delonEnUS,
    en_US as delonZhTw,
    SettingsService,
    ko_KR as delonKoKR,
    zh_CN as delonZhCn,
} from '@delon/theme';
import {EruptAppData} from "@core/startup/erupt-app.data";

interface LangData {
    text: string;
    ng: any;
    zorro: any;
    dateFns: any;
    delon: any;
    abbr: string;
}

const DEFAULT = 'zh-CN';
const LANGS: { [key: string]: LangData } = {
    'zh-CN': {
        text: '简体中文',
        ng: ngZh,
        zorro: zh_CN,
        dateFns: df_zh_cn,
        delon: delonZhCn,
        abbr: '🇨🇳',
    },
    'zh-TW': {
        text: '繁体中文',
        ng: ngZhTw,
        zorro: zh_TW,
        dateFns: df_zh_tw,
        delon: delonZhTw,
        abbr: '🇭🇰',
    },
    'en-US': {
        text: 'English',
        ng: ngEn,
        zorro: en_US,
        dateFns: df_en,
        delon: delonEnUS,
        abbr: '🇬🇧',
    },
    // 'ko-KR': {
    //     text: '한국어',
    //     ng: ngKO,
    //     zorro: ko_KR,
    //     dateFns: df_ko,
    //     delon: delonKoKR,
    //     abbr: '🇰🇷',
    // },
    'ja-JP': {
        text: '日本語',
        ng: ngJA,
        zorro: ja_JP,
        dateFns: df_ja,
        delon: delonZhCn,
        abbr: '🇯🇵',
    },
};

@Injectable({providedIn: 'root'})
export class I18NService implements AlainI18NService {

    private _default = DEFAULT;

    private change$ = new BehaviorSubject<string | null>(null);


    private _langs = Object.keys(LANGS).map(code => {
        const item = LANGS[code];
        return {code, text: item.text, abbr: item.abbr};
    });

    constructor(
        settings: SettingsService,
        private nzI18nService: NzI18nService,
        private delonLocaleService: DelonLocaleService,
        private translate: TranslateService,
    ) {
        // `@ngx-translate/core` 预先知道支持哪些语言
        const lans = this._langs.map(item => item.code);
        translate.addLangs(lans);
        let defaultLan;
        if (EruptAppData.get() && EruptAppData.get().locales && EruptAppData.get().locales.length > 0) {
            defaultLan = settings.layout.lang || EruptAppData.get().locales[0];
        } else {
            defaultLan = settings.layout.lang || translate.getBrowserLang();
        }
        if (lans.includes(defaultLan)) {
            this._default = defaultLan;
        }
        this.updateLangData(this._default);
    }

    private updateLangData(lang: string) {
        const item = LANGS[lang];
        registerLocaleData(item.ng);
        this.nzI18nService.setLocale(item.zorro);
        this.nzI18nService.setDateLocale(item.dateFns);
        (window as any).__locale__ = item.dateFns;
        this.delonLocaleService.setLocale(item.delon);
    }

    get change(): Observable<string> {
        return this.change$.asObservable().pipe(filter(w => w != null)) as Observable<string>;
    }

    use(lang: string): void {
        lang = lang || this.translate.getDefaultLang();
        if (this.currentLang === lang) return;
        this.updateLangData(lang);
        this.translate.use(lang).subscribe(() => this.change$.next(lang));
    }

    /** 获取语言列表 */
    getLangs() {
        let langs = [];
        for (let lang of this._langs) {
            for (let locale of EruptAppData.get().locales) {
                if (lang.code.toLocaleLowerCase() == locale.toLocaleLowerCase()) {
                    langs.push(lang);
                }
            }
        }
        return langs;
    }

    /** 翻译 */
    fanyi(key: string, interpolateParams?: {}) {
        return this.translate.instant(key, interpolateParams);
    }

    /** 默认语言 */
    get defaultLang() {
        return this._default;
    }

    /** 当前语言 */
    get currentLang() {
        return this.translate.currentLang || this.translate.getDefaultLang() || this._default;
    }
}
