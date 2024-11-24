export interface TenantDomainInfo {
    code: string;
    name: string;
    logo: string;
    js: string;
    css: string;
}


let tenantDomainInfo: TenantDomainInfo = window["eruptTenantDomainInfo"] || null;

export class EruptTenantInfoData {

    static get() {
        return tenantDomainInfo;
    }

    static put(value: TenantDomainInfo) {
        tenantDomainInfo = value;
    }

}
