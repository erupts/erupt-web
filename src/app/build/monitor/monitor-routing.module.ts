import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ServerComponent} from './view/server/server.component';
import {RedisComponent} from './view/redis/redis.component';
import {DiagnosisComponent} from './view/diagnosis/diagnosis.component';

const routes: Routes = [
    {path: 'server', component: ServerComponent},
    {path: 'redis', component: RedisComponent},
    {path: 'diagnosis', component: DiagnosisComponent},
    {path: '', redirectTo: 'server', pathMatch: 'full'}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MonitorRoutingModule {
}
