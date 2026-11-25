import {Component, Input} from '@angular/core';
import {_HttpClient} from "@delon/theme";
import {finalize} from "rxjs/operators";
import {R} from "@shared/model/api.model";
import {RestPath} from "../../../erupt/model/erupt.enum";
import {DashboardDSL, DashboardTheme, ScreenFit, ScreenPanel} from "../../model/dashboard.model";

/** The model, and its attachment field, a background image is uploaded through (see CubeDashboard.background) */
const BACKGROUND_ERUPT = 'CubeDashboard', BACKGROUND_FIELD = 'background';

@Component({
    selector: 'cube-puzzle-dashboard-config',
    templateUrl: './cube-puzzle-dashboard-config.html',
    standalone: false
})
export class CubePuzzleDashboardConfig {

    @Input() dsl: DashboardDSL;

    /** The dashboard is a data screen: its settings replace the ones only a scrolling page has */
    @Input() screen = false;

    uploading = false;

    readonly fits = Object.values(ScreenFit);

    readonly panels = Object.values(ScreenPanel);

    constructor(private http: _HttpClient) {
    }

    /**
     * Uploads the chosen image as an attachment and makes it the background. The server checks type and
     * size by the field's @AttachmentType and answers with the stored path, kept here under the
     * attachment root like the GeoJSON of a map.
     */
    upload(input: HTMLInputElement) {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        this.uploading = true;
        this.http.post(`${RestPath.file}/upload/${BACKGROUND_ERUPT}/${BACKGROUND_FIELD}`, form, null, {
            headers: {erupt: BACKGROUND_ERUPT}, observe: 'body'
        }).pipe(finalize(() => this.uploading = false)).subscribe((res: R<string>) => {
            if (res?.data) {
                this.dsl.settings.backgroundImage = '/erupt-attachment' + res.data;
            }
        });
    }

    protected readonly DashboardTheme = DashboardTheme;
}
