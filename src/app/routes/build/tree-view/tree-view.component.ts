import {AfterViewInit, Component, Injectable, OnInit} from '@angular/core';
import {DataService} from "../../../erupt/service/data.service";
import {EruptModel} from "../../../erupt/model/erupt.model";

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements OnInit, AfterViewInit {

  eruptModel: EruptModel;

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
  }


  constructor(private dataService: DataService) {
    this.dataService.getEruptBuild("mmo").subscribe(
      em => {
        this.eruptModel = em;
        const c = {};
        c[em.eruptJson.tree.pid] = "$null$";
      }
    );

    this.dataService.queryEruptTreeData("mmo").subscribe(
      data => {
        console.log("=================");
        console.log(data);
      }
    );
  }
}
