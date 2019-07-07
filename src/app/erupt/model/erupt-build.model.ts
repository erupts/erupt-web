/**
 * Created by liyuepeng on 2018-12-29.
 */
import { EruptModel } from "./erupt.model";
import { EruptFieldModel } from "./erupt-field.model";

export interface EruptBuildModel {
  eruptModel: EruptModel;
  tabErupts?: { [key: string]: EruptModel };
  combineErupts?: { [key: string]: EruptModel };
  referenceErupts?: { [key: string]: EruptModel };
}

export interface EruptAndEruptFieldModel {
  eruptModel: EruptModel;
  eruptFieldModel: EruptFieldModel;
  alainTableConfig?: any[];
}