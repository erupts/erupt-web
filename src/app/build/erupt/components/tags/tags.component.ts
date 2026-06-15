import {Component, Input, OnInit} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataHandlerService} from "../../service/data-handler.service";

@Component({
    standalone: false,
    selector: 'erupt-tags',
    templateUrl: './tags.component.html',
    styles: []
})
export class TagsComponent implements OnInit {

    @Input() eruptModel: EruptModel;

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() eruptField: EruptFieldModel;

    @Input() size;

    @Input() readonly;

    @Input() eruptParentName: string;

    isLoading = false;

    constructor(private dataService: DataService,
                private dataHandlerService: DataHandlerService) {
    }

    ngOnInit() {
    }

    load(open) {
        if (open && this.eruptField.eruptFieldJson.edit.tagsType.fetchHandler?.length) {
            this.fetchOptions();
        }
    }

    refresh() {
        this.eruptField.componentValue = null;
        this.fetchOptions();
    }

    private fetchOptions() {
        this.isLoading = true;
        const formData = this.eruptBuildModel
            ? this.dataHandlerService.eruptValueToObject(this.eruptBuildModel)
            : {};
        this.dataService.findTagsItem(this.eruptModel.eruptName, this.eruptField.fieldName, formData, this.eruptParentName).subscribe(data => {
            this.eruptField.componentValue = data;
            this.isLoading = false;
        });
    }

}
