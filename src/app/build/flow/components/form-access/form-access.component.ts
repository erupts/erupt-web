import {Component, Input} from '@angular/core';
import {EruptBuildModel} from "../../../erupt/model/erupt-build.model";

@Component({
  selector: 'app-form-access',
  templateUrl: './form-access.component.html',
  styleUrls: ['./form-access.component.less']
})
export class FormAccessComponent {

    @Input() eruptBuild: EruptBuildModel;

}
