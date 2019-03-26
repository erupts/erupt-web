import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

// delon
import { AlainThemeModule } from "@delon/theme";
import { DelonABCModule } from "@delon/abc";
import { DelonACLModule } from "@delon/acl";
import { DelonFormModule } from "@delon/form";

// #region third libs
import { NgZorroAntdModule } from "ng-zorro-antd";
import { CountdownModule } from "ngx-countdown";
import { QrComponent } from "./qr/qr.component";
import { CKEditorComponent } from "./ckeditor/ckeditor.component";
import { SafePipe } from "./pipe/safe.pipe";

const THIRD_MODULES = [
  NgZorroAntdModule,
  CountdownModule
];
// #endregion

// #region your componets & directives
const COMPONENTS = [CKEditorComponent, SafePipe];
const DIRECTIVES = [];

// #endregion

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    AlainThemeModule.forChild(),
    DelonABCModule,
    DelonACLModule,
    DelonFormModule,
    // third libs
    ...THIRD_MODULES
  ],
  declarations: [
    // your components
    ...COMPONENTS,
    ...DIRECTIVES,
    QrComponent
  ],
  entryComponents: [
    QrComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AlainThemeModule,
    DelonABCModule,
    DelonACLModule,
    DelonFormModule,
    // third libs
    ...THIRD_MODULES,
    // your components
    ...COMPONENTS,
    ...DIRECTIVES
  ]
})
export class SharedModule {
}
