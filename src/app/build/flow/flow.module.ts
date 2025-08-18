import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {DragDropModule} from '@angular/cdk/drag-drop';

// ng-zorro模块
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzInputModule} from 'ng-zorro-antd/input';
import {NzDrawerModule} from 'ng-zorro-antd/drawer';
import {NzMessageModule} from 'ng-zorro-antd/message';
import {NzIconModule} from 'ng-zorro-antd/icon';
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
import {EruptFlowComponent} from './components/erupt-flow/erupt-flow.component';
import {StartNodeComponent} from '@flow/node/start/start-node.component';
import {ApprovalNodeComponent} from '@flow/node/appoval/approval-node.component';
import {CcNodeComponent} from '@flow/node/cc/cc-node.component';
import {ExclusiveNodeComponent} from '@flow/node/exclusive/exclusive-node.component';
import {BranchNodeComponent} from '@flow/node/base/branch-node.component';
import {InsertBtnComponent} from '@flow/node/base/insert-btn.component';

import {NodeComponent} from '@flow/node/base/node.component';

// 图标
import {CommonModule} from "@angular/common";
import {FlowRoutingModule} from "./flow-routing.module";
import {RecursiveNodeComponent} from "@flow/node/recursive-node.component";
import {ParallelNodeComponent} from "@flow/node/parallel/parallel-node.component";
import {FlowManagementComponent} from './view/flow-management/flow-management.component';
import {NzDropDownModule} from "ng-zorro-antd/dropdown";
import {SharedModule} from "@shared/shared.module";
import {FlowApiService} from "@flow/service/flow-api.service";
import {FlowConfigComponent} from '@flow/view/flow-management/flow-config/flow-config.component';
import {IconColorPickerComponent} from '@flow/components/icon-color-picker/icon-color-picker.component';
import {EruptModule} from "../erupt/erupt.module";
import {EruptFlowFormComponent} from './components/erupt-flow-form/erupt-flow-form.component';
import {FlowDashboardComponent} from './view/flow-dashboard/flow-dashboard.component';
import {FlowApprovalComponent} from './view/flow-approval/flow-approval.component';
import {FlexNodeComponent} from '@flow/node/flex/flex-node.component';
import {FlowDataService} from "@flow/service/flow-data.service";
import {FormAccessComponent} from './components/form-access/form-access.component';
import {CreateInstanceComponent} from './view/flow-dashboard/create-instance/create-instance.component';
import {EndNodeComponent} from './node/end/end-node.component';


@NgModule({
    declarations: [
        EruptFlowComponent,
        StartNodeComponent,
        ApprovalNodeComponent,
        CcNodeComponent,
        ExclusiveNodeComponent,
        ParallelNodeComponent,
        NodeComponent,
        BranchNodeComponent,
        InsertBtnComponent,
        RecursiveNodeComponent,
        FlowManagementComponent,
        FlowConfigComponent,
        IconColorPickerComponent,
        EruptFlowFormComponent,
        FlowDashboardComponent,
        FlowApprovalComponent,
        FlexNodeComponent,
        FormAccessComponent,
        CreateInstanceComponent,
        EndNodeComponent
    ],
    providers: [
        FlowApiService,
        FlowDataService
    ],
    imports: [
        SharedModule,
        FlowRoutingModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        DragDropModule,
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
        NzInputNumberModule,
        NzDropDownModule,
        EruptModule
    ]
})
export class FlowModule {
}
