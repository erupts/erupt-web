// 请参考：https://ng-alain.com/docs/i18n
import {Platform} from '@angular/cdk/platform';
import {DatePipe, registerLocaleData} from '@angular/common';
import ngEn from '@angular/common/locales/en';
import ngZh from '@angular/common/locales/zh';
import ngFr from '@angular/common/locales/fr';
import ngEs from '@angular/common/locales/es';
import ngRu from '@angular/common/locales/ru';
import ngZhTw from '@angular/common/locales/zh-Hant';
import ngKO from '@angular/common/locales/ko';
import ngJA from '@angular/common/locales/ja';
import ngDe from '@angular/common/locales/de';
import ngPt from '@angular/common/locales/pt';
import ngId from '@angular/common/locales/id';
import ngAr from '@angular/common/locales/ar';

import {Injectable, OnInit} from '@angular/core';
import {
    DelonLocaleService,
    en_US as delonEnUS,
    es_ES as delonEs,
    fr_FR as delonFr,
    ja_JP as delonJp,
    ko_KR as delonKo,
    SettingsService,
    zh_CN as delonZhCn,
    zh_TW as delonZhTw
} from '@delon/theme';
import {
    ar as dfAr,
    de as dfDe,
    enUS as dfEn,
    es as dfEs,
    fr as dfFr,
    id as dfId,
    ja as dfJp,
    ko as dfKo,
    pt as dfPt,
    ru as dfRu,
    zhCN as dfZhCn,
    zhTW as dfZhTw
} from 'date-fns/locale';
import {NzSafeAny} from 'ng-zorro-antd/core/types';
import {
    ar_EG as zorroAr,
    de_DE as zorroDe,
    en_US as zorroEnUS,
    es_ES as zorroEs,
    fr_FR as zorroFr,
    ja_JP,
    ko_KR,
    NzI18nService,
    pt_PT as zorroPt,
    ru_RU as zorroRu,
    zh_CN as zorroZhCN,
    zh_TW as zorroZhTW
} from 'ng-zorro-antd/i18n';
import {EruptAppData} from "@shared/model/erupt-app.model";

interface LangConfigData {
    abbr: string;
    text: string;
    date: NzSafeAny;
    ng: NzSafeAny;
    zorro: NzSafeAny;
    delon: NzSafeAny;
    columnWidthZoom: number;
    color: string;
}

const LANGS: { [key: string]: LangConfigData } = {
    'en-US': {
        abbr: '🇺🇸',
        text: 'English',
        date: dfEn,
        ng: ngEn,
        zorro: zorroEnUS,
        delon: delonEnUS,
        columnWidthZoom: 1.3,
        color: '#1E88E5'
    },
    'fr-FR': {
        abbr: '🇫🇷',
        text: 'En français',
        date: dfFr,
        ng: ngFr,
        zorro: zorroFr,
        delon: delonFr,
        columnWidthZoom: 1.5,
        color: '#3949AB'
    },
    'de-DE': {
        abbr: '🇩🇪',
        text: 'Deutsch',
        date: dfDe,
        ng: ngDe,
        zorro: zorroDe,
        delon: delonEnUS, // 若无 delon.de_DE 可保留英文
        columnWidthZoom: 1.5,
        color: '#6D4C41'
    },
    'zh-CN': {
        abbr: '🇨🇳',
        text: '简体中文',
        ng: ngZh,
        date: dfZhCn,
        zorro: zorroZhCN,
        delon: delonZhCn,
        columnWidthZoom: 1,
        color: '#E53935'
    },
    'zh-TW': {
        abbr: '🇭🇰',
        text: '繁体中文',
        date: dfZhTw,
        ng: ngZhTw,
        zorro: zorroZhTW,
        delon: delonZhTw,
        columnWidthZoom: 1,
        color: '#8E24AA'
    },
    'ja-JP': {
        abbr: '🇯🇵',
        text: '日本語',
        date: dfJp,
        ng: ngJA,
        zorro: ja_JP,
        delon: delonJp,
        columnWidthZoom: 1,
        color: '#F06292'
    },
    'ko-KR': {
        abbr: '🇰🇷',
        text: '한국어',
        date: dfKo,
        ng: ngKO,
        zorro: ko_KR,
        delon: delonKo,
        columnWidthZoom: 1,
        color: '#00ACC1'
    },
    'ru-RU': {
        abbr: '🇷🇺',
        text: 'русск',
        date: dfRu,
        ng: ngRu,
        zorro: zorroRu,
        delon: delonEs,
        columnWidthZoom: 1.5,
        color: '#546E7A'
    },
    'es-ES': {
        abbr: '🇪🇸',
        text: 'español',
        date: dfEs,
        ng: ngEs,
        zorro: zorroEs,
        delon: delonEnUS,
        columnWidthZoom: 1.5,
        color: '#FB8C00'
    },
    'pt-PT': {
        abbr: '🇵🇹',
        text: 'Português',
        date: dfPt,
        ng: ngPt,
        zorro: zorroPt,
        delon: delonEnUS, // 暂无 delon.pt_PT
        columnWidthZoom: 1.5,
        color: '#43A047'
    },
    'id-ID': {
        abbr: '🇮🇩',
        text: 'Bahasa Indonesia',
        date: dfId,
        ng: ngId,
        zorro: zorroEnUS, // fallback，zorro 无 id-ID
        delon: delonEnUS,
        columnWidthZoom: 1.5,
        color: '#D81B60'
    },
    'ar-SA': {
        abbr: '🇸🇦',
        text: 'العربية',
        date: dfAr,
        ng: ngAr,
        zorro: zorroAr, // 使用 ar_EG 替代
        delon: delonEnUS,
        columnWidthZoom: 1.2,
        color: '#009688'
    },
};

for (let key in LANGS) {
    registerLocaleData(LANGS[key].ng);
}


@Injectable()
export class I18NService implements OnInit {

    currentLang: string;

    langMapping: { [key: string]: string };

    public datePipe: DatePipe;

    public getDefaultLang(): string {
        if (this.settings.layout.lang) {
            return this.settings.layout.lang;
        }
        let res = (navigator.languages ? navigator.languages[0] : null) || navigator.language;
        const arr = res.split('-');
        return arr.length <= 1 ? res : `${arr[0]}-${arr[1].toUpperCase()}`;
    }

    constructor(
        private settings: SettingsService,
        private nzI18nService: NzI18nService,
        private delonLocaleService: DelonLocaleService,
        private platform: Platform
    ) {
    }

    ngOnInit(): void {
    }

    loadLangData(success) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', "erupt.i18n.csv?v=" + EruptAppData.get().hash);
        xhr.send();
        xhr.onreadystatechange = () => {
            let langMapping = {};
            if (xhr.readyState == 4 && xhr.status == 200) {
                let allRows = xhr.responseText.split(/\r?\n|\r/);
                let header = allRows[0].split(',');
                let index;
                for (let i = 0; i < header.length; i++) {
                    if (header[i] == this.currentLang) {
                        index = i;
                    }
                }
                allRows.forEach(it => {
                    let row = parseCSVRow(it);
                    langMapping[row[0]] = row[index];
                })
                this.langMapping = langMapping;
                success();
            }

            function parseCSVRow(row): any[] {
                let result = [];
                let field = '';
                let inQuotes = false;
                let escapeNext = false;

                for (let i = 0; i < row.length; i++) {
                    let char = row[i];

                    if (escapeNext) {
                        field += char;
                        escapeNext = false;
                    } else if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        result.push(field);
                        field = '';
                    } else if (char === '\\') {
                        escapeNext = true;
                    } else {
                        field += char;
                    }
                }

                if (field.length > 0) {
                    result.push(field);
                }

                return result;
            }
        };

    }

    use(lang: string): void {
        const item = LANGS[lang];
        registerLocaleData(item.ng, item.abbr);
        this.nzI18nService.setLocale(item.zorro);
        this.nzI18nService.setDateLocale(item.date);
        this.delonLocaleService.setLocale(item.delon);
        this.datePipe = new DatePipe(lang);
        this.currentLang = lang;
    }

    getCurrLangInfo(): LangConfigData {
        return LANGS[this.currentLang] || LANGS['zh-CN'];
    }

    getLangs(): Array<{ code: string; text: string; abbr: string }> {
        return Object.keys(LANGS).map(it => {
            return {
                code: it,
                text: LANGS[it].text,
                abbr: LANGS[it].abbr
            }
        })
    }

    fanyi(key: string) {
        return this.langMapping[key] || key;
    }

}
