import {Injectable} from "@angular/core";
import {EruptMap, MapAdapter, MapOptions, MapProvider} from "@shared/model/map.model";
import {WindowModel} from "@shared/model/window.model";

// each adapter is its own lazy chunk: only the configured vendor's code is ever fetched
const ADAPTERS: Record<MapProvider, () => Promise<MapAdapter>> = {
    [MapProvider.AMAP]: () => import('./amap.adapter'),
    [MapProvider.BAIDU]: () => import('./baidu.adapter'),
    [MapProvider.TENCENT]: () => import('./tencent.adapter'),
    [MapProvider.TIANDITU]: () => import('./leaflet.adapter'),
    [MapProvider.GOOGLE]: () => import('./google.adapter'),
    [MapProvider.OSM]: () => import('./leaflet.adapter')
};

@Injectable({providedIn: 'root'})
export class MapService {

    /**
     * Whether eruptSiteConfig.map carries what the configured vendor needs.
     */
    configured(): boolean {
        const cfg = WindowModel.map;
        if (!ADAPTERS[cfg?.provider]) return false;
        switch (cfg.provider) {
            case MapProvider.OSM:
                return true;
            case MapProvider.AMAP:
                return !!cfg.key && !!cfg.securityJsCode;
            default:
                return !!cfg.key;
        }
    }

    async create(el: HTMLElement, options: MapOptions = {}): Promise<EruptMap> {
        const cfg = WindowModel.map;
        const adapter = await ADAPTERS[cfg.provider]();
        return adapter.create(el, {
            center: cfg.center,
            dark: document.documentElement.classList.contains('dark'),
            ...options
        }, cfg);
    }

}
