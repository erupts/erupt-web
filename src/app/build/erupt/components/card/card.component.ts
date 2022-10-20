import {Component, Input, OnInit} from '@angular/core';
import {EruptBuildModel} from "../../model/erupt-build.model";

@Component({
  selector: 'erupt-card',
  templateUrl: './card.component.html',
  styles: []
})
export class CardComponent implements OnInit {

  constructor() { }

  @Input() eruptBuildModel: EruptBuildModel;

  ngOnInit() {
  }

}
