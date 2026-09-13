import {Component, Input} from '@angular/core';
import {EruptModel} from "../../model/erupt.model";
import {EruptFieldModel} from "../../model/erupt-field.model";
import {DataService} from "@shared/service/data.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {DataHandlerService} from "../../service/data-handler.service";

@Component({
    standalone: false,
    selector: 'erupt-textarea',
    templateUrl: './textarea.component.html',
    styles: [`
        .erupt-textarea-shell {
            position: relative;
        }

        /* Room for the tray, so it never sits on top of the last line of text.
           nzAutosize measures scrollHeight, so the reserved strip is honoured. */
        .erupt-textarea-shell textarea {
            padding-bottom: 34px;
        }

        .erupt-textarea-tray {
            position: absolute;
            right: 8px;
            bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding-left: 6px;
            border-radius: 7px;
            /* opaque, so scrolled text passes behind it rather than through it */
            background: var(--erupt-bg-container, #fff);
        }

        .erupt-textarea-count {
            font-size: 12px;
            opacity: .55;
            line-height: 1.6;
        }
    `]
})
export class TextareaComponent {

    @Input() eruptModel: EruptModel;

    @Input() eruptBuildModel: EruptBuildModel;

    @Input() eruptField: EruptFieldModel;

    @Input() readonly: boolean;

    @Input() eruptParentName: string;

    suggestions: string[] = [];

    loading = false;

    private fetched = false;

    constructor(private dataService: DataService,
                private dataHandlerService: DataHandlerService) {
    }

    // length defaults to Integer.MAX_VALUE on the backend, which means unconfigured
    private static readonly UNLIMITED = 2147483647;

    get edit() {
        return this.eruptField.eruptFieldJson.edit;
    }

    get maxLength(): number | null {
        let length = this.edit.textareaType?.length;
        return length && length < TextareaComponent.UNLIMITED ? length : null;
    }

    // suggestions merge static mentions with fetchHandler results on the server,
    // so both cases go through the same endpoint; fetched once per form
    loadMentions() {
        if (this.fetched) return;
        this.fetched = true;
        this.loading = true;
        const formData = this.eruptBuildModel
            ? this.dataHandlerService.eruptValueToObject(this.eruptBuildModel)
            : {};
        this.dataService.findTextareaMention(this.eruptModel.eruptName, this.eruptField.fieldName, formData, this.eruptParentName).subscribe({
            next: data => {
                this.suggestions = data || [];
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.fetched = false;
            }
        });
    }

}
