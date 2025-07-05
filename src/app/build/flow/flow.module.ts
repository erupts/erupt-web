import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

// ng-zorro模块
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzInputModule} from 'ng-zorro-antd/input';
import {NzDrawerModule} from 'ng-zorro-antd/drawer';
import {NzMessageModule} from 'ng-zorro-antd/message';
import {NZ_ICONS, NzIconModule} from 'ng-zorro-antd/icon';
import {NzTypographyModule} from 'ng-zorro-antd/typography';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzSelectModule} from 'ng-zorro-antd/select';
import {NzCheckboxModule} from 'ng-zorro-antd/checkbox';
import {NzRadioModule} from 'ng-zorro-antd/radio';
import {NzDatePickerModule} from 'ng-zorro-antd/date-picker';
import {NzTimePickerModule} from 'ng-zorro-antd/time-picker';
import {NzSwitchModule} from 'ng-zorro-antd/switch';
import {NzSliderModule} from 'ng-zorro-antd/slider';
import {NzRateModule} from 'ng-zorro-antd/rate';
import {NzUploadModule} from 'ng-zorro-antd/upload';
import {NzModalModule} from 'ng-zorro-antd/modal';
import {NzPopconfirmModule} from 'ng-zorro-antd/popconfirm';
import {NzToolTipModule} from 'ng-zorro-antd/tooltip';
import {NzPopoverModule} from 'ng-zorro-antd/popover';
import {NzCardModule} from 'ng-zorro-antd/card';
import {NzDividerModule} from 'ng-zorro-antd/divider';
import {NzSpaceModule} from 'ng-zorro-antd/space';
import {NzGridModule} from 'ng-zorro-antd/grid';
import {NzLayoutModule} from 'ng-zorro-antd/layout';
import {NzMenuModule} from 'ng-zorro-antd/menu';
import {NzPageHeaderModule} from 'ng-zorro-antd/page-header';
import {NzTabsModule} from 'ng-zorro-antd/tabs';
import {NzTableModule} from 'ng-zorro-antd/table';
import {NzListModule} from 'ng-zorro-antd/list';
import {NzAvatarModule} from 'ng-zorro-antd/avatar';
import {NzBadgeModule} from 'ng-zorro-antd/badge';
import {NzTagModule} from 'ng-zorro-antd/tag';
import {NzProgressModule} from 'ng-zorro-antd/progress';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import {NzSkeletonModule} from 'ng-zorro-antd/skeleton';
import {NzAlertModule} from 'ng-zorro-antd/alert';
import {NzNotificationModule} from 'ng-zorro-antd/notification';
import {NzResultModule} from 'ng-zorro-antd/result';
import {NzEmptyModule} from 'ng-zorro-antd/empty';
import {NzDescriptionsModule} from 'ng-zorro-antd/descriptions';
import {NzTimelineModule} from 'ng-zorro-antd/timeline';
import {NzStepsModule} from 'ng-zorro-antd/steps';
import {NzCollapseModule} from 'ng-zorro-antd/collapse';
import {NzTreeModule} from 'ng-zorro-antd/tree';
import {NzTransferModule} from 'ng-zorro-antd/transfer';
import {NzCascaderModule} from 'ng-zorro-antd/cascader';
import {NzMentionModule} from 'ng-zorro-antd/mention';
import {NzAutocompleteModule} from 'ng-zorro-antd/auto-complete';
import {NzInputNumberModule} from 'ng-zorro-antd/input-number';

// 自定义组件
import {FlowComponent} from './flow.component';
import {ProcessRenderComponent} from './views/process/process-render.component';
import {StartNodeComponent} from './views/process/node/start/start-node.component';
import {ApprovalNodeComponent} from './views/process/node/appoval/approval-node.component';
import {CcNodeComponent} from './views/process/node/cc/cc-node.component';
import {ExclusiveNodeComponent} from './views/process/node/exclusive/exclusive-node.component';
import {GatewayNodeComponent} from './views/process/node/gateway/gateway-node.component';
import {BranchNodeComponent} from './views/process/node/base/branch-node.component';
import {InsertBtnComponent} from './views/process/node/base/insert-btn.component';

import {NodeComponent} from './views/process/node/base/node.component';

// 图标
import {CloseOutline, CopyOutline, EditOutline, MinusOutline, PlusOutline} from '@ant-design/icons-angular/icons';
import {CommonModule} from "@angular/common";
import {FlowRoutingModule} from "./flow-routing.module";
import {RecursiveNodeComponent} from "./views/process/node/recursive-node.component";
import {ParallelNodeComponent} from "./views/process/node/parallel/parallel-node.component";

const icons = [PlusOutline, MinusOutline, EditOutline, CloseOutline, CopyOutline];

@NgModule({
    declarations: [
        FlowComponent,
        ProcessRenderComponent,
        StartNodeComponent,
        ApprovalNodeComponent,
        CcNodeComponent,
        ExclusiveNodeComponent,
        ParallelNodeComponent,
        GatewayNodeComponent,
        NodeComponent,
        BranchNodeComponent,
        InsertBtnComponent,
        RecursiveNodeComponent
    ],
    imports: [
        FlowRoutingModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        NzButtonModule,
        NzInputModule,
        NzDrawerModule,
        NzMessageModule,
        NzIconModule,
        NzTypographyModule,
        NzFormModule,
        NzSelectModule,
        NzCheckboxModule,
        NzRadioModule,
        NzDatePickerModule,
        NzTimePickerModule,
        NzSwitchModule,
        NzSliderModule,
        NzRateModule,
        NzUploadModule,
        NzModalModule,
        NzPopconfirmModule,
        NzToolTipModule,
        NzPopoverModule,
        NzCardModule,
        NzDividerModule,
        NzSpaceModule,
        NzGridModule,
        NzLayoutModule,
        NzMenuModule,
        NzPageHeaderModule,
        NzTabsModule,
        NzTableModule,
        NzListModule,
        NzAvatarModule,
        NzBadgeModule,
        NzTagModule,
        NzProgressModule,
        NzSpinModule,
        NzSkeletonModule,
        NzAlertModule,
        NzNotificationModule,
        NzResultModule,
        NzEmptyModule,
        NzDescriptionsModule,
        NzTimelineModule,
        NzStepsModule,
        NzCollapseModule,
        NzTreeModule,
        NzTransferModule,
        NzCascaderModule,
        NzMentionModule,
        NzAutocompleteModule,
        NzInputNumberModule
    ],
    providers: [
        {provide: NZ_ICONS, useValue: icons}
    ]
})
export class FlowModule {
}
