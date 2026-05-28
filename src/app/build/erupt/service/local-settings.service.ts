import {Injectable} from "@angular/core";

export interface EruptColumnConfig {
    show?: boolean;
    width?: number | string;
}

export interface EruptLocalSettings {
    columns?: Record<string, EruptColumnConfig>;
    treeWidth?: number;
}

@Injectable({providedIn: "root"})
export class LocalSettingsService {

    private key(eruptName: string): string {
        return `erupt.${eruptName}`;
    }

    get(eruptName: string): EruptLocalSettings {
        try {
            const raw = localStorage.getItem(this.key(eruptName));
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    private set(eruptName: string, settings: EruptLocalSettings): void {
        localStorage.setItem(this.key(eruptName), JSON.stringify(settings));
    }

    patch(eruptName: string, patch: Partial<EruptLocalSettings>): void {
        this.set(eruptName, {...this.get(eruptName), ...patch});
    }

    getColumns(eruptName: string): Record<string, EruptColumnConfig> {
        return this.get(eruptName).columns || {};
    }

    setColumns(eruptName: string, columns: Record<string, EruptColumnConfig>): void {
        this.patch(eruptName, {columns});
    }
}
