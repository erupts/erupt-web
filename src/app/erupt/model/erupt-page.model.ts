/**
 * Created by liyuepeng on 2018-12-29.
 */
import { EruptModel } from "./erupt.model";
import { EruptFieldModel } from "./erupt-field.model";

export interface EruptPageModel {
  eruptModel: EruptModel;
  subErupts: Array<EruptAndEruptFieldModel>;
}

export interface EruptAndEruptFieldModel {
  eruptModel: EruptModel;
  eruptFieldModel: EruptFieldModel;
  alainTableConfig?: Array<any>;
}