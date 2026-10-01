import {Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild} from '@angular/core';
import {NzMessageService} from "ng-zorro-antd/message";
import {STColumn} from "@delon/abc/st";
import {I18NService} from "@core";
import {EruptMap, MapPlace, MarkerItem} from "@shared/model/map.model";
import {MapService} from "@shared/service/map/map.service";
import {EruptBuildModel} from "../../model/erupt-build.model";
import {FieldVisibility, Vis} from "../../model/erupt.model";
import {View} from "../../model/erupt-field.model";
import {UiBuildService} from "../../service/ui-build.service";

/**
 * A row with a resolved position, ready to become a marker.
 */
interface MapPoint {
    pk: any;
    lng: number;
    lat: number;
    color: string;
    title: string;
    fields: { title: string; html: string }[];
}

// name of the window hook the info window's "open" link calls; one per component instance
let hookSeq = 0;

@Component({
    standalone: false,
    selector: 'vis-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.less']
})
export class MapComponent implements OnChanges, OnDestroy {

    @Input() eruptBuildModel: EruptBuildModel;
    @Input() data: any[] = [];
    @Input() vis: Vis;
    @Output() onEdit = new EventEmitter<any>();

    @ViewChild('mapEl', {static: true}) mapEl: ElementRef<HTMLDivElement>;

    loading = true;

    // rows that carry a usable position
    points: MapPoint[] = [];

    private map: EruptMap;

    private creating: Promise<EruptMap>;

    private readonly hook = `__eruptVisMapOpen${hookSeq++}`;

    private columnMap = new Map<string, STColumn>();

    constructor(private mapService: MapService,
                private msg: NzMessageService,
                private i18n: I18NService,
                private uiBuildService: UiBuildService) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['data'] || changes['vis'] || changes['eruptBuildModel']) {
            this.build();
        }
    }

    ngOnDestroy() {
        this.map?.destroy();
        delete window[this.hook];
    }

    private async build() {
        if (!this.eruptBuildModel || !this.vis?.mapView) return;
        this.columnMap = new Map();
        for (const col of this.uiBuildService.viewToAlainTableConfig(this.eruptBuildModel, true)) {
            this.columnMap.set(String(col.index), col);
        }
        this.points = this.resolvePoints();
        window[this.hook] = (pk: any) => this.onEdit.emit(this.points.find(p => String(p.pk) === String(pk))?.pk ?? pk);
        if (await this.ensureMap()) {
            this.renderMarkers();
        }
    }

    /**
     * Position of every row: the JSON of an EditType.MAP field or a numeric lng/lat pair.
     */
    private resolvePoints(): MapPoint[] {
        const mv = this.vis.mapView;
        const pkCol = this.eruptBuildModel.eruptModel.eruptJson.primaryKeyCol;
        const [titleView, ...rest] = this.visibleViews();
        const points: MapPoint[] = [];
        for (const row of this.data || []) {
            const place: MapPlace | null = mv.locationField
                ? this.mapService.toPlace(row[mv.locationField])
                // bare lng / lat columns carry no system: read as legacy AMap (GCJ-02) values
                : this.mapService.toPlace({lng: row[mv.lngField], lat: row[mv.latField]});
            if (!place) continue;
            points.push({
                pk: row[pkCol],
                lng: place.lng,
                lat: place.lat,
                color: (mv.colorField && row[mv.colorField]) || undefined,
                title: titleView ? this.render(row, titleView) : String(row[pkCol]),
                fields: rest.map(v => ({title: v.title, html: this.render(row, v)}))
            });
        }
        return points;
    }

    private visibleViews(): (View & { fieldName: string })[] {
        const mv = this.vis.mapView;
        const skip = new Set([mv.locationField, mv.lngField, mv.latField].filter(f => !!f));
        const include = this.vis.fieldVisibility === FieldVisibility.INCLUDE;
        const fields = this.vis.fields || [];
        const result: (View & { fieldName: string })[] = [];
        for (const field of this.eruptBuildModel.eruptModel.eruptFieldModels) {
            for (const view of field.eruptFieldJson.views || []) {
                if (skip.has(view.column)) continue;
                const listed = fields.indexOf(view.column) !== -1;
                if (include ? listed : !listed) {
                    result.push({...view, fieldName: field.fieldName});
                }
            }
        }
        return result;
    }

    private render(row: any, view: View & { fieldName: string }): string {
        const col = this.columnMap.get(view.fieldName);
        if (col?.format) {
            return col.format(row, col, null) ?? '';
        }
        const value = row[view.column];
        return value == null ? '' : String(value);
    }

    /**
     * Creates the map once; resolves false when no vendor is configured.
     */
    private async ensureMap(): Promise<boolean> {
        if (this.map) return true;
        if (!this.mapService.configured()) {
            this.loading = false;
            this.msg.error(this.i18n.fanyi("map.not_configured"));
            return false;
        }
        // concurrent builds share one map
        this.creating ??= this.mapService.create(this.mapEl.nativeElement, {zoom: 4, controls: true});
        this.map = await this.creating;
        this.loading = false;
        return true;
    }

    private renderMarkers() {
        const items: MarkerItem[] = this.points.map(point => ({
            position: point,
            color: point.color,
            title: this.plain(point.title),
            data: point,
            onClick: () => this.openInfo(point)
        }));
        this.map.setMarkers(items, this.vis.mapView.cluster);
        this.fit();
    }

    fit() {
        if (this.points.length === 1) {
            this.map?.setCenter(this.points[0], 14);
        } else if (this.points.length) {
            this.map?.fitView();
        }
    }

    private openInfo(point: MapPoint) {
        const rows = point.fields
            .map(f => `<div class="vis-map-row"><span class="vis-map-key">${this.escape(f.title)}</span><span>${f.html || '—'}</span></div>`)
            .join('');
        this.map.openInfo(
            `<div class="vis-map-info">
                <div class="vis-map-title">${point.title}</div>
                ${rows}
                <a class="vis-map-open" onclick="window['${this.hook}'](this.dataset.pk)" data-pk="${this.escape(String(point.pk))}">
                    <i class="anticon anticon-edit"></i>
                </a>
            </div>`, point);
    }

    private plain(html: string): string {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || '';
    }

    private escape(text: string): string {
        return String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
    }

}
