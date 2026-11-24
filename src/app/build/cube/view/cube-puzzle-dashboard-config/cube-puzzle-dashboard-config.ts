import {Component, Input} from '@angular/core';
import {_HttpClient} from "@delon/theme";
import {finalize} from "rxjs/operators";
import {R} from "@shared/model/api.model";
import {RestPath} from "../../../erupt/model/erupt.enum";
import {
    DashboardDSL, DashboardTheme, ScreenFit, ScreenHeader, ScreenNumberFont, ScreenPalette, ScreenPanel
} from "../../model/dashboard.model";
import {paletteColors} from "../../model/screen-palette";

/** The model, and its attachment field, an image of the settings is uploaded through (see CubeDashboard.background) */
const UPLOAD_ERUPT = 'CubeDashboard', UPLOAD_FIELD = 'background';

@Component({
    selector: 'cube-puzzle-dashboard-config',
    templateUrl: './cube-puzzle-dashboard-config.html',
    standalone: false
})
export class CubePuzzleDashboardConfig {

    @Input() dsl: DashboardDSL;

    /** The dashboard is a data screen: its settings replace the ones only a scrolling page has */
    @Input() screen = false;

    /** The setting an upload is running for */
    uploading: string | null = null;

    readonly imageTypes = 'image/png,image/jpeg,image/webp,image/gif';

    readonly fits = Object.values(ScreenFit);

    readonly panels = Object.values(ScreenPanel);

    readonly headers = Object.values(ScreenHeader);

    readonly palettes = Object.values(ScreenPalette);

    readonly numberFonts = Object.values(ScreenNumberFont);

    constructor(private http: _HttpClient) {
    }

    /** The colors a palette shows as swatches; the accent palette follows the accent being edited */
    colors(palette: ScreenPalette): string[] {
        return paletteColors(palette, this.dsl.settings.screen?.accent);
    }

    /**
     * Uploads the chosen image as an attachment and writes its address into a setting. The server checks
     * type and size by the field's @AttachmentType and answers with the stored path, kept here under the
     * attachment root like the GeoJSON of a map.
     */
    upload(input: HTMLInputElement, target: object, key: string) {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        this.uploading = key;
        this.http.post(`${RestPath.file}/upload/${UPLOAD_ERUPT}/${UPLOAD_FIELD}`, form, null, {
            headers: {erupt: UPLOAD_ERUPT}, observe: 'body'
        }).pipe(finalize(() => this.uploading = null)).subscribe((res: R<string>) => {
            if (res?.data) {
                target[key] = '/erupt-attachment' + res.data;
            }
        });
    }

    protected readonly DashboardTheme = DashboardTheme;
}
