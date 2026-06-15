import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ServerComponent} from './view/server/server.component';
import {RedisComponent} from './view/redis/redis.component';
import {DiagnosisComponent} from './view/diagnosis/diagnosis.component';

const routes: Routes = [
    {path: 'server', component: ServerComponent, data: {title: '服务监控'}},
    {path: 'redis', component: RedisComponent, data: {title: 'Redis 监控'}},
    {path: 'diagnosis', component: DiagnosisComponent, data: {title: '诊断监控'}},
    {path: '', redirectTo: 'server', pathMatch: 'full'}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MonitorRoutingModule {
}
