import {Component, Inject, Input, OnInit} from "@angular/core";
import {DataService} from "@shared/service/data.service";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {SelectMode} from "../../model/erupt.enum";
import {NzMessageService} from "ng-zorro-antd/message";
import { NzModalService } from "ng-zorro-antd/modal";

@Component({
    selector: "app-reference-table",
    template: `
        <erupt-table
                [referenceTable]="{eruptBuild:eruptBuild,eruptField:eruptField,mode:mode,dependVal:dependVal,parentEruptName:parentEruptName,tabRef:tabRef}">
        </erupt-table>
    `,
    styleUrls: ["./reference-table.component.less"]
})
export class ReferenceTableComponent implements OnInit {

    @Input() eruptBuild: EruptBuildModel;

    @Input() eruptField: EruptFieldModel;

    @Input() mode: SelectMode = SelectMode.radio;

    @Input() dependVal: any;

    @Input() parentEruptName: string;

    @Input() tabRef: boolean = false;

    // @ts-ignore
    constructor(private dataService: DataService,
                @Inject(NzMessageService)
                private msg: NzMessageService,
                @Inject(NzModalService)
                private modal: NzModalService) {
    }

    ngOnInit() {

    }

}
