import {CommonModule} from '@angular/common';
import {NgModule, Type} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {DelonACLModule} from '@delon/acl';
import {AlainThemeModule} from '@delon/theme';

import {SHARED_DELON_MODULES} from './shared-delon.module';
import {SHARED_ZORRO_MODULES} from './shared-zorro.module';
import {RipperDirective} from "@shared/directive/ripper.directive";
import {EruptIframeComponent} from "@shared/component/iframe.component";
import {SafeHtmlPipe} from "@shared/pipe/safe-html.pipe";
import {SafeScriptPipe} from "@shared/pipe/safe-script.pipe";
import {SafeUrlPipe} from "@shared/pipe/safe-url.pipe";
import {DataService} from "@shared/service/data.service";
import {I18nPipe} from "@shared/pipe/i18n.pipe";
import {NavComponent} from "@shared/nav/nav.component";
import {NzAffixModule} from "ng-zorro-antd/affix";
import {HeaderI18nComponent} from "@shared/component/i18n.component";
import {EruptStorageService} from "@shared/service/erupt-storage.service";

// #region third libs
// import { NgxTinymceModule } from 'ngx-tinymce';

const THIRDMODULES: Array<Type<any>> = [];
// #endregion

// #region your componets & directives
const COMPONENTS: Array<Type<any>> = [EruptIframeComponent, NavComponent, HeaderI18nComponent];
const DIRECTIVES: Array<Type<any>> = [RipperDirective, SafeHtmlPipe, SafeScriptPipe, SafeUrlPipe, I18nPipe];

// #endregion

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ReactiveFormsModule,
        AlainThemeModule.forChild(),
        DelonACLModule,
        ...SHARED_DELON_MODULES,
        ...SHARED_ZORRO_MODULES,
        // third libs
        ...THIRDMODULES,
        NzAffixModule
    ],
    declarations: [
        // your components
        ...COMPONENTS,
        ...DIRECTIVES,
    ],
    providers: [
        DataService,
        EruptStorageService
    ],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        AlainThemeModule,
        DelonACLModule,
        ...SHARED_DELON_MODULES,
        ...SHARED_ZORRO_MODULES,
        // third libs
        ...THIRDMODULES,
        // your components
        ...COMPONENTS,
        ...DIRECTIVES
    ]
})
export class SharedModule {
}
