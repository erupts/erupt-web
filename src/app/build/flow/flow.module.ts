import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {DragDropModule} from '@angular/cdk/drag-drop';

// ng-zorro模块
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';

// 自定义组件
import {EruptFlowComponent} from './components/erupt-flow/erupt-flow.component';
import {StartNodeComponent} from '@flow/node/start/start-node.component';
import {ApprovalNodeComponent} from '@flow/node/appoval/approval-node.component';
import {CcNodeComponent} from '@flow/node/cc/cc-node.component';
import {GatewayNodeComponent} from '@flow/node/gateway/gateway-node.component';
import {BranchNodeComponent} from '@flow/node/base/branch-node.component';
import {InsertBtnComponent} from '@flow/node/base/insert-btn.component';

import {NodeComponent} from '@flow/node/base/node.component';

// 图标
import {CommonModule} from "@angular/common";
import {FlowRoutingModule} from "./flow-routing.module";
import {RecursiveNodeComponent} from "@flow/node/recursive-node.component";
import {FlowManagementComponent} from './view/flow-management/flow-management.component';
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
import {GatewayJoinComponent} from './node/gateway-join/gateway-join.component';
import {ReviewUserComponent} from './components/review-user/review-user.component';
import {FlowUpmsApiService} from "@flow/service/flow-upms-api.service";
import {NzSegmentedModule} from 'ng-zorro-antd/segmented';
import {UpmsSelectComponent} from "@flow/components/upms-select/upms-select.component";
import {UpmsDataService} from "@flow/service/upms-data.service";
import {SubNodeComponent} from '@flow/node/sub/sub-node.component';
import {NzImageDirective} from "ng-zorro-antd/image";
import {FlowApprovalDetailComponent} from '@flow/view/flow-approval-detail/flow-approval-detail.component';
import {FlowPrintPreviewComponent} from '@flow/view/flow-approval-detail/print-preview/print-preview.component';

@NgModule({
    declarations: [
        EruptFlowComponent,
        StartNodeComponent,
        ApprovalNodeComponent,
        CcNodeComponent,
        GatewayNodeComponent,
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
        EndNodeComponent,
        GatewayJoinComponent,
        ReviewUserComponent,
        UpmsSelectComponent,
        SubNodeComponent,
        FlowApprovalDetailComponent,
        FlowPrintPreviewComponent
    ],
    providers: [
        FlowApiService,
        FlowDataService,
        UpmsDataService,
        FlowUpmsApiService
    ],
    imports: [
        NzSegmentedModule,
        SharedModule,
        FlowRoutingModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        DragDropModule,
        EruptModule,
        NzTooltipDirective,
        NzImageDirective,
        NzTypographyComponent,
        NzEmptyComponent
    ]
})
export class FlowModule {
}
