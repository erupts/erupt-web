import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {NzMessageService} from "ng-zorro-antd/message";
import {from, of, Subject} from "rxjs";
import {catchError, debounceTime, distinctUntilChanged, switchMap} from "rxjs/operators";
import {I18NService} from "@core";
import {EruptMap, LngLat, MapPlace} from "@shared/model/map.model";
import {MapService} from "@shared/service/map/map.service";
import {MapType} from "../../model/erupt-field.model";

/**
 * EditType.MAP editor: pick a place by keyword or by clicking the map. Stores
 * {id?, name, address, lng, lat} as JSON; readonly shows the stored place.
 */
@Component({
    standalone: false,
    selector: "map-edit",
    templateUrl: "./map-edit.component.html",
    styleUrls: ["./map-edit.component.less"]
})
export class MapEditComponent implements OnInit, OnDestroy {

    @Input() value: any;

    @Output() valueChange = new EventEmitter<string | null>();

    @Input() zoom: number = 11;

    @Input() readonly: boolean = false;

    @Input() mapType: MapType;

    @ViewChild('mapEl', {static: true}) mapEl: ElementRef<HTMLDivElement>;

    loading = true;

    // the vendor SDK is ready
    loaded = false;

    keyword = '';

    places: MapPlace[] = [];

    pointSelectMode = false;

    place: MapPlace | null = null;

    private map: EruptMap;

    private readonly keyword$ = new Subject<string>();

    constructor(private mapService: MapService,
                private msg: NzMessageService,
                private i18n: I18NService) {
    }

    async ngOnInit() {
        if (!this.mapService.configured()) {
            this.loading = false;
            this.msg.error(this.i18n.fanyi("map.not_configured"));
            return;
        }
        this.map = await this.mapService.create(this.mapEl.nativeElement, {zoom: this.zoom, controls: true});
        this.loading = false;
        this.loaded = true;
        this.keyword$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            // a failing vendor search is reported once and keeps the stream alive
            switchMap(kw => kw.trim()
                ? from(this.map.search(kw.trim())).pipe(catchError(e => {
                    this.msg.warning(e?.message || String(e));
                    return of([] as MapPlace[]);
                }))
                : of([] as MapPlace[]))
        ).subscribe(places => this.places = places);
        this.map.onClick(pos => this.pointSelectMode && !this.readonly && this.pick(pos));
        const place = this.mapService.toPlace(this.value);
        if (place) {
            this.show(place, this.zoom);
        }
    }

    ngOnDestroy() {
        this.keyword$.complete();
        this.map?.destroy();
    }

    search(keyword: string) {
        this.keyword = keyword;
        this.keyword$.next(keyword);
    }

    // the input text no longer names the picked place: drop the pick
    blur() {
        if (this.place && this.place.name !== this.keyword) {
            this.place = null;
        }
    }

    select(place: MapPlace) {
        this.show(place, 15);
        this.valueChange.emit(JSON.stringify(this.mapService.stamp(place)));
    }

    // confirms the typed keyword with its first suggestion
    confirm() {
        if (this.place) return;
        if (this.places.length) {
            this.select(this.places[0]);
        } else {
            this.msg.warning(this.i18n.fanyi(this.keyword ? "map.select_valid_address" : "map.select_address_first"));
        }
    }

    togglePointSelect() {
        this.pointSelectMode = !this.pointSelectMode;
    }

    clear() {
        this.place = null;
        this.keyword = '';
        this.places = [];
        this.map.clearMarkers();
        this.valueChange.emit(null);
    }

    private async pick(pos: LngLat) {
        const address = await this.map.reverseGeocode(pos) || `${pos.lng},${pos.lat}`;
        this.select({...pos, name: address, address});
    }

    private show(place: MapPlace, zoom: number) {
        this.place = place;
        this.keyword = place.name;
        this.map.setMarkers([{position: place, title: place.name}]);
        this.map.setCenter(place, zoom);
        this.map.openInfo(this.info(place), place);
    }

    private info(place: MapPlace): string {
        const lines = [`<b>${this.escape(place.name)}</b>`];
        if (place.address && place.address !== place.name) {
            lines.push(this.escape(place.address));
        }
        lines.push(this.i18n.fanyi('map.info.lng') + place.lng, this.i18n.fanyi('map.info.lat') + place.lat);
        return lines.join('<br>');
    }

    private escape(text: string): string {
        return String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
    }

}
