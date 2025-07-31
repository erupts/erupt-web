import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FlowManagementComponent} from "@flow/view/flow-management/flow-management.component";
import {FlowDashboardComponent} from "@flow/view/flow-dashboard/flow-dashboard.component";
import {FlowApprovalComponent} from "@flow/view/flow-approval/flow-approval.component";

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
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FlowRoutingModule {
}
