import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TerminalComponent} from './view/terminal/terminal.component';

const routes: Routes = [
    {path: '', component: TerminalComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TerminalRoutingModule {
}
