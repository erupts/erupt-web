export interface FlowGroup {
    id: number;
    name: string;
    sort: number;
}

export interface FlowConfig {
    id: number;
    name: string;
    erupt: string;
    flowGroup: FlowGroup;
    enable: string;
    remark: string;
    rule: FlowRule;
    setting: Record<string, any>;
}

export interface FlowRule {

}
