import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ModuleCenterComponent} from './view/module-center/module-center.component';

const routes: Routes = [
    {path: '', component: ModuleCenterComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ModuleCenterRoutingModule {
}
