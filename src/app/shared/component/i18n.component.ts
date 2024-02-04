import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {I18NService} from '@core';
import {SettingsService} from '@delon/theme';
import {EruptAppData} from "@shared/model/erupt-app.model";

@Component({
    selector: 'i18n-choice',
    template: `
        <ng-container *ngIf="langs.length > 1">
            <i nz-dropdown [nzDropdownMenu]="langMenu"
               nzPlacement="bottomRight" nz-icon
               nzType="global"></i>
            <nz-dropdown-menu #langMenu>
                <ul nz-menu nzSelectable>
                    <li nz-menu-item *ngFor="let item of langs" [nzSelected]="item.code == curLangCode"
                        (click)="change(item.code)">
                        <span role="img" [attr.aria-label]="item.text" class="pr-xs">{{ item.abbr }}</span>
                        {{ item.text }}
                    </li>
                </ul>
            </nz-dropdown-menu>
        </ng-container>
    `,
    host: {
        '[class.flex-1]': 'true'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderI18nComponent {

    langs: Array<{ code: string; text: string; abbr: string }> = [];

    curLangCode: string;

    constructor(private settings: SettingsService,
                private i18n: I18NService,
                @Inject(DOCUMENT) private doc: any) {
        let locales = EruptAppData.get().locales;
        let localesObj = {};
        for (let key of locales) {
            localesObj[key] = key;
        }
        for (let lang of this.i18n.getLangs()) {
            if (localesObj[lang.code]) {
                this.langs.push(lang);
            }
        }
        this.curLangCode = this.settings.getLayout()['lang']
    }

    change(lang: string): void {
        this.i18n.use(lang);
        this.settings.setLayout('lang', lang);
        setTimeout(() => this.doc.location.reload());
    }

}
