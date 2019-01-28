import { NgModule } from "@angular/core";
import { SharedModule } from "@shared/shared.module";

import { LayoutDefaultComponent } from "./default/default.component";
import { LayoutFullScreenComponent } from "./fullscreen/fullscreen.component";
import { HeaderComponent } from "./default/header/header.component";
import { SidebarComponent } from "./default/sidebar/sidebar.component";
import { HeaderSearchComponent } from "./default/header/components/search.component";
import { HeaderNotifyComponent } from "./default/header/components/notify.component";
import { HeaderTaskComponent } from "./default/header/components/task.component";
import { HeaderIconComponent } from "./default/header/components/icon.component";
import { HeaderFullScreenComponent } from "./default/header/components/fullscreen.component";
import { HeaderStorageComponent } from "./default/header/components/storage.component";
import { HeaderUserComponent } from "./default/header/components/user.component";

import { SettingDrawerComponent } from "./default/setting-drawer/setting-drawer.component";
import { SettingDrawerItemComponent } from "./default/setting-drawer/setting-drawer-item.component";
import { MenuComponent } from "./default/menu/menu.component";
// passport
import { LayoutPassportComponent } from "./passport/passport.component";
import { MenuItemComponent } from "./default/menu/menu-item.component";

const SETTINGDRAWER = [SettingDrawerComponent, SettingDrawerItemComponent];

const COMPONENTS = [
  LayoutDefaultComponent,
  LayoutFullScreenComponent,
  HeaderComponent,
  SidebarComponent,
  MenuComponent,
  MenuItemComponent,
  ...SETTINGDRAWER
];

const HEADERCOMPONENTS = [
  HeaderSearchComponent,
  HeaderNotifyComponent,
  HeaderTaskComponent,
  HeaderIconComponent,
  HeaderFullScreenComponent,
  HeaderStorageComponent,
  HeaderUserComponent
];

const PASSPORT = [
  LayoutPassportComponent
];

@NgModule({
  imports: [SharedModule],
  entryComponents: SETTINGDRAWER,
  declarations: [
    ...COMPONENTS,
    ...HEADERCOMPONENTS,
    ...PASSPORT
  ],
  exports: [
    ...COMPONENTS,
    ...PASSPORT
  ]
})
export class LayoutModule {
}
