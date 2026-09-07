import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RemoteRoutingModule} from './remote-routing.module';
import {RemoteEntryComponent} from './view/entry/entry.component';
import {DesktopComponent} from './view/desktop/desktop.component';
import {SshComponent} from './view/ssh/ssh.component';

@NgModule({
    declarations: [RemoteEntryComponent, DesktopComponent, SshComponent],
    imports: [
        CommonModule,
        FormsModule,
        RemoteRoutingModule
    ]
})
export class RemoteModule {
}
