import {EruptModel, Power} from "./erupt.model";

export interface EruptBuildModel {
    eruptModel: EruptModel;
    power?: Power;
    tabErupts?: { [key: string]: EruptBuildModel };
    combineErupts?: { [key: string]: EruptModel };
    referenceErupts?: { [key: string]: EruptModel };
    operationErupts?: { [key: string]: EruptModel };
}

