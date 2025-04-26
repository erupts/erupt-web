import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {GlobalFooterModule} from '@delon/abc/global-footer';
import {HotkeyModule} from '@delon/abc/hotkey';
import {NoticeIconModule} from '@delon/abc/notice-icon';
import {AlainThemeModule} from '@delon/theme';
import {LayoutDefaultModule} from '@delon/theme/layout-default';
import {SettingDrawerModule} from '@delon/theme/setting-drawer';
import {ThemeBtnModule} from '@delon/theme/theme-btn';
import {NzAutocompleteModule} from 'ng-zorro-antd/auto-complete';
import {NzAvatarModule} from 'ng-zorro-antd/avatar';
import {NzBadgeModule} from 'ng-zorro-antd/badge';
import {NzCardModule} from 'ng-zorro-antd/card';
import {NzDropDownModule} from 'ng-zorro-antd/dropdown';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzGridModule} from 'ng-zorro-antd/grid';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzInputModule} from 'ng-zorro-antd/input';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import {DragDropModule} from '@angular/cdk/drag-drop';

// eslint-disable-next-line import/order
import {LayoutBlankComponent} from './blank/blank.component';
// passport
import {LayoutPassportComponent} from './passport/passport.component';
import {HeaderComponent} from "./erupt/header/header.component";
import {NzButtonModule} from "ng-zorro-antd/button";
import {NzDrawerModule} from "ng-zorro-antd/drawer";
import {NzDividerModule} from "ng-zorro-antd/divider";
import {SidebarComponent} from "./erupt/sidebar/sidebar.component";
import {HeaderSearchComponent} from "./erupt/header/components/search.component";
import {HeaderFullScreenComponent} from "./erupt/header/components/fullscreen.component";
import {HeaderUserComponent} from "./erupt/header/components/user.component";
import {SettingsComponent} from "./erupt/header/settings/settings.component";
import {NzAlertModule} from "ng-zorro-antd/alert";
import {NzTableModule} from "ng-zorro-antd/table";
import {SharedModule} from "@shared/shared.module";
import {NzBackTopModule} from "ng-zorro-antd/back-top";
import {ReuseTabModule} from "@delon/abc/reuse-tab";
import {HeaderRTLComponent} from "./erupt/header/components/rtl.component";
import {MenuComponent} from './erupt/menu/menu.component';
import {NzBreadCrumbModule} from "ng-zorro-antd/breadcrumb";
import {LayoutEruptComponent} from "./erupt/erupt.component";
import {NzWaterMarkModule} from "ng-zorro-antd/water-mark";

const COMPONENTS = [LayoutEruptComponent, LayoutBlankComponent];

const HEADER_COMPONENTS = [
    HeaderSearchComponent,
    HeaderFullScreenComponent,
    // HeaderI18nComponent,
    HeaderUserComponent,
    // HeaderRTLComponent,
    HeaderComponent,
    SidebarComponent,
    SettingsComponent,
    HeaderRTLComponent
    // SettingsComponent
];

const PASSPORT = [LayoutPassportComponent];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        AlainThemeModule.forChild(),
        ThemeBtnModule,
        SettingDrawerModule,
        LayoutDefaultModule,
        NoticeIconModule,
        HotkeyModule,
        GlobalFooterModule,
        NzDropDownModule,
        NzInputModule,
        NzAutocompleteModule,
        NzGridModule,
        NzFormModule,
        NzSpinModule,
        NzBadgeModule,
        NzAvatarModule,
        NzIconModule,
        NzButtonModule,
        NzCardModule,
        NzDrawerModule,
        NzDividerModule,
        NzAlertModule,
        NzTableModule,
        SharedModule,
        NzBackTopModule,
        ReuseTabModule,
        NzBreadCrumbModule,
        NzWaterMarkModule,
        DragDropModule
    ],
    declarations: [...COMPONENTS, ...HEADER_COMPONENTS, ...PASSPORT, MenuComponent],
    exports: [...COMPONENTS, ...PASSPORT]
})
export class LayoutModule {
}
