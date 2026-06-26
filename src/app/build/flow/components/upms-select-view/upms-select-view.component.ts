import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FlowPermission, FlowUpmsScope, UpmsScope} from "@flow/model/flow.model";
import {UpmsDataService} from "@flow/service/upms-data.service";
import {UpmsSelectComponent} from "@flow/components/upms-select/upms-select.component";
import {NzModalService} from "ng-zorro-antd/modal";

@Component({
    standalone: false,
    selector: 'upms-select-view',
    templateUrl: './upms-select-view.component.html',
    styleUrl: './upms-select-view.component.less'
})
export class UpmsSelectViewComponent {

    protected readonly FlowPermission = FlowPermission;

    constructor(private upmsDataService: UpmsDataService, private modal: NzModalService) {

    }

    @Input() upmsScopes: FlowUpmsScope[] = []

    @Output() upmsScopesChange = new EventEmitter<FlowUpmsScope[]>();


    /**
     * Get the tag color for the permission scope
     */
    getScopeTagColor(scope: string): string {
        const colorMap: { [key: string]: string } = {
            'ORG': 'blue',
            'ROLE': 'green',
            'USER': 'orange',
            'POST': 'purple'
        };
        return colorMap[scope] || 'default';
    }

    /**
     * Get the icon for the permission scope
     */
    getScopeIcon(scope: string): string {
        const iconMap: { [key: string]: string } = {
            'ORG': 'apartment',
            'ROLE': 'safety-certificate',
            'USER': 'user',
            'POST': 'idcard'
        };
        return iconMap[scope] || 'question';
    }

    getScopeValue(upmsScope: FlowUpmsScope): string {
        if (upmsScope.scope == UpmsScope.USER) {
            for (let user of this.upmsDataService.upmsData.users) {
                if (user.key == upmsScope.scopeValue) {
                    return user.value;
                }
            }
        } else if (upmsScope.scope == UpmsScope.ROLE) {
            for (let role of this.upmsDataService.upmsData.roles) {
                if (role.key == upmsScope.scopeValue) {
                    return role.value;
                }
            }
        } else if (upmsScope.scope == UpmsScope.POST) {
            for (let post of this.upmsDataService.upmsData.posts) {
                if (post.key == upmsScope.scopeValue) {
                    return post.value;
                }
            }
        } else if (upmsScope.scope == UpmsScope.ORG) {
            for (let org of this.upmsDataService.upmsData.orgs) {
                if (org.key == upmsScope.scopeValue) {
                    return org.value;
                }
            }
        }
        return upmsScope.scopeValue.toString();
    }

    removeScope(event: MouseEvent, scope: FlowUpmsScope) {
        event.stopPropagation(); // Prevent click event bubbling on the tag
        this.upmsScopes = this.upmsScopes.filter(s => s !== scope);
        this.upmsScopesChange.emit(this.upmsScopes);
    }

    changeSubmitPermission(permission: FlowPermission) {
        if (permission == FlowPermission.SPECIFIC) {
            let ref = this.modal.create({
                nzTitle: 'Please select the visible scope',
                nzWidth: '880px',
                nzDraggable: true,
                nzStyle: {top: '30px'},
                nzBodyStyle: {padding: '0'},
                nzContent: UpmsSelectComponent,
            })
            ref.getContentComponent().flowUpmsScopes = this.upmsScopes || [];
            ref.getContentComponent().flowUpmsScopesChange.subscribe(scopes => {
                this.upmsScopes = scopes;
                this.upmsScopesChange.emit(this.upmsScopes);
            });
        } else {
            this.upmsScopes = null;
            this.upmsScopesChange.emit(this.upmsScopes);
        }
    }

}
