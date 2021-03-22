// import {Component, Input, OnInit} from '@angular/core';
// import {Edit, EruptFieldModel, VL} from "../../model/erupt-field.model";
// import {DataService} from "@shared/service/data.service";
// import {EruptModel} from "../../model/erupt.model";
// import {ChoiceEnum} from "../../model/erupt.enum";
//
// @Component({
//     selector: 'erupt-choice',
//     templateUrl: './choice.component.html',
//     styles: []
// })
// export class ChoiceComponent implements OnInit {
//
//     @Input() eruptModel: EruptModel;
//
//     @Input() eruptField: EruptFieldModel;
//
//     @Input() size;
//
//     @Input() eruptParentName: string;
//
//     @Input() vagueSearch: boolean = false;
//
//     optionList: VL[] = [];
//
//     isLoading = false;
//
//     choiceEnum = ChoiceEnum;
//
//     constructor(private dataService: DataService) {
//     }
//
//     ngOnInit() {
//         if (this.eruptField.eruptFieldJson.edit.choiceType.type == ChoiceEnum.RADIO || this.vagueSearch) {
//             this.load(true);
//         }
//     }
//
//     load(open) {
//         if (open) {
//             if (this.optionList.length == 0) {
//                 this.isLoading = true;
//                 // this.dataService.findChoiceItem(this.eruptModel.eruptName, this.eruptField.fieldName, this.eruptParentName).subscribe(data => {
//                 //     this.optionList = data;
//                 //     this.isLoading = false;
//                 // });
//             }
//         }
//     }
//
//     changeTagAll($event) {
//         for (let vl of this.optionList) {
//             vl.$viewValue = $event;
//         }
//     }
//
// }
