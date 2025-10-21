import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FlowManagementComponent} from "@flow/view/flow-management/flow-management.component";
import {FlowDashboardComponent} from "@flow/view/flow-dashboard/flow-dashboard.component";
import {FlowApprovalComponent} from "@flow/view/flow-approval/flow-approval.component";
import {FlowApprovalDetailComponent} from "@flow/view/flow-approval-detail/flow-approval-detail.component";

const routes: Routes = [
    {
        path: "management",
        component: FlowManagementComponent,
    },
    {
        path: "dashboard",
        component: FlowDashboardComponent,
    },
    {
        path: "approval",
        component: FlowApprovalComponent,
    },
    {
        path: "approval-detail/:no",
        pathMatch: "full",
        component: FlowApprovalDetailComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FlowRoutingModule {
}
