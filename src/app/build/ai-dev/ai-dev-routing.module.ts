import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PoolListComponent} from './view/pool-list/pool-list.component';
import {PoolDetailComponent} from './view/pool-detail/pool-detail.component';

const routes: Routes = [
    {path: 'pool', component: PoolListComponent},
    {path: 'pool/:id', component: PoolDetailComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AiDevRoutingModule {
}
