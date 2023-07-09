import {Component, Input, OnInit} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";

@Component({
    selector: 'erupt-tags',
    templateUrl: './tags.component.html',
    styles: []
})
export class TagsComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    @Input() eruptField: EruptFieldModel;

    @Input() size;

    @Input() readonly;

    @Input() eruptParentName: string;

    isLoading = false;

    constructor(private dataService: DataService) {
    }

    ngOnInit() {
    }

    load(open) {
        if (open) {
            if (this.eruptField.componentValue && this.eruptField.componentValue.length == 0) {
                this.isLoading = true;
                this.dataService.findTagsItem(this.eruptModel.eruptName, this.eruptField.fieldName, this.eruptParentName).subscribe(data => {
                    this.eruptField.componentValue = data;
                    this.isLoading = false;
                });
            }
        }
    }

}
