import {Component, DoCheck, Input, OnInit} from '@angular/core';
import {NzSizeLDSType} from 'ng-zorro-antd/core/types';
import {EruptFieldModel} from '../../model/erupt-field.model';

interface KvRow {
    key: string;
    value: string;
}

/**
 * KEY_VALUE editor: rows of key / value text inputs. A String field receives the pairs as a JSON object
 * string; a Map field (e.g. {@code @JdbcTypeCode(SqlTypes.JSON) Map<String, String>}) receives the object
 * itself, which the backend deserializes into the map. Rows with an empty key stay on screen but are left
 * out of the stored value; a duplicate key is flagged and the last one wins, as JSON would.
 */
@Component({
    standalone: false,
    selector: 'erupt-key-value',
    templateUrl: './key-value.component.html',
    styleUrls: ['./key-value.component.less']
})
export class KeyValueComponent implements OnInit, DoCheck {

    @Input() eruptField: EruptFieldModel;

    @Input() size: NzSizeLDSType = 'default';

    @Input() readonly = false;

    rows: KvRow[] = [];

    /** the JSON this component last wrote, to tell its own writes from an outside reset */
    private lastJson: string | null = null;

    ngOnInit(): void {
        this.load();
    }

    ngDoCheck(): void {
        // the form reloads the same component with another record: pick the new value up
        const current = this.normalize(this.eruptField.eruptFieldJson.edit.$value);
        if (current !== this.lastJson) this.load();
    }

    get max(): number {
        return this.eruptField.eruptFieldJson.edit.keyValueType?.max || 0;
    }

    get keySuggestions(): string[] {
        return this.eruptField.eruptFieldJson.edit.keyValueType?.keys || [];
    }

    /** String fields store JSON text, anything else (a Map) stores the object itself */
    private get asObject(): boolean {
        return this.eruptField.fieldReturnName !== 'String';
    }

    get canAdd(): boolean {
        return !this.readonly && (this.max === 0 || this.rows.length < this.max);
    }

    /** a suggested key already present on some row is offered greyed out */
    isKeyTaken(key: string): boolean {
        return this.rows.some(r => r.key === key);
    }

    isDuplicate(row: KvRow): boolean {
        return !!row.key && this.rows.some(r => r !== row && r.key === row.key);
    }

    add(): void {
        if (!this.canAdd) return;
        this.rows.push({key: '', value: ''});
    }

    remove(i: number): void {
        this.rows.splice(i, 1);
        this.write();
    }

    write(): void {
        const obj: Record<string, string> = {};
        for (const r of this.rows) {
            if (r.key) obj[r.key] = r.value ?? '';
        }
        const json = Object.keys(obj).length ? JSON.stringify(obj) : null;
        this.lastJson = json;
        this.eruptField.eruptFieldJson.edit.$value = json === null ? null : this.asObject ? obj : json;
    }

    private load(): void {
        const raw = this.eruptField.eruptFieldJson.edit.$value;
        this.lastJson = this.normalize(raw);
        this.rows = [];
        const obj = this.parse(raw);
        if (obj) {
            for (const k of Object.keys(obj)) {
                const v = obj[k];
                // non-string values (numbers, booleans, nested objects) are shown as their JSON text
                this.rows.push({key: k, value: typeof v === 'string' ? v : v === null ? '' : JSON.stringify(v)});
            }
        }
    }

    private parse(raw: any): Record<string, any> | null {
        if (raw == null || raw === '') return null;
        if (typeof raw === 'object') return raw;
        try {
            const v = JSON.parse(raw);
            return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
        } catch {
            return null;
        }
    }

    private normalize(raw: any): string | null {
        if (raw == null || raw === '') return null;
        return typeof raw === 'string' ? raw : JSON.stringify(raw);
    }
}
