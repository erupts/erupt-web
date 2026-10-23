import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SharedModule} from '@shared/shared.module';
import {AiDevRoutingModule} from './ai-dev-routing.module';
import {PoolListComponent} from './view/pool-list/pool-list.component';
import {PoolDetailComponent} from './view/pool-detail/pool-detail.component';
import {AdMarkdownComponent} from './view/markdown/ad-markdown.component';
import {AdCliLogoComponent} from './view/cli-logo/ad-cli-logo.component';
import {NzTimelineModule} from 'ng-zorro-antd/timeline';

@NgModule({
    declarations: [PoolListComponent, PoolDetailComponent, AdMarkdownComponent, AdCliLogoComponent],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        NzTimelineModule,
        AiDevRoutingModule
    ]
})
export class AiDevModule {
}
