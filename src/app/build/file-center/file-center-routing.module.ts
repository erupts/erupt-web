import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FileCenterComponent} from './view/file-center/file-center.component';

const routes: Routes = [
    {path: '', component: FileCenterComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FileCenterRoutingModule {
}
