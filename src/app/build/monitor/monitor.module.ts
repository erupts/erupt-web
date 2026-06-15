import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NzDescriptionsModule} from 'ng-zorro-antd/descriptions';
import {SharedModule} from '@shared/shared.module';
import {MonitorRoutingModule} from './monitor-routing.module';
import {MonitorService} from './service/monitor.service';
import {ServerComponent} from "./view/server/server.component";
import {RedisComponent} from "./view/redis/redis.component";
import {DiagnosisComponent} from "./view/diagnosis/diagnosis.component";

@NgModule({
    declarations: [ServerComponent, RedisComponent, DiagnosisComponent],
    imports: [
        CommonModule,
        SharedModule,
        NzDescriptionsModule,
        MonitorRoutingModule
    ],
    providers: [MonitorService]
})
export class MonitorModule {
}
