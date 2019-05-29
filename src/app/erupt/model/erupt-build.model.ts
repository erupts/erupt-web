/**
 * Created by liyuepeng on 2018-12-29.
 */
import { EruptModel } from "./erupt.model";
import { EruptFieldModel } from "./erupt-field.model";

export interface EruptBuildModel {
  eruptModel: EruptModel;
  subErupts?: EruptAndEruptFieldModel[];
  combineErupts?: EruptAndEruptFieldModel[];
}

export interface EruptAndEruptFieldModel {
  eruptModel: EruptModel;
  eruptFieldModel: EruptFieldModel;
  alainTableConfig?: any[];
}