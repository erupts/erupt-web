import {EruptModel, Power} from "./erupt.model";
import {EruptFieldModel} from "./erupt-field.model";

export interface EruptBuildModel {
    eruptModel: EruptModel;
    power?: Power;
    tabErupts?: { [key: string]: EruptBuildModel };
    combineErupts?: { [key: string]: EruptModel };
    referenceErupts?: { [key: string]: EruptModel };
    operationErupts?: { [key: string]: EruptModel };
}

export interface EruptAndEruptFieldModel {
    eruptModel: EruptModel;
    eruptFieldModel: EruptFieldModel;
    alainTableConfig?: any[];
}
