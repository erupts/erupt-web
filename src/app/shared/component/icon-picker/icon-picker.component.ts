import {ChangeDetectorRef, Component, ElementRef, forwardRef, Input, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NzSizeLDSType} from 'ng-zorro-antd/core/types';
import {FA_STYLES, FaIconOption, FaIconService, FaStyle, ICON_COLORS, IconColor, splitIconColor} from '@shared/service/fa-icon.service';

/**
 * Font Awesome icon picker bound through ngModel. The input stays a free text field so any class string
 * (including ones outside the catalogue) can still be typed; the popover offers search over the whole
 * Font Awesome free set with a style filter and, unless {@link showColors} is off, a color row that
 * appends "|#hex" or "|primary" to the value (see erupt-icon.ts for the convention).
 */
@Component({
    standalone: false,
    selector: 'erupt-icon-picker',
    templateUrl: './icon-picker.component.html',
    styleUrls: ['./icon-picker.component.less'],
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IconPickerComponent), multi: true}]
})
export class IconPickerComponent implements ControlValueAccessor {

    /** Cells rendered per batch; scrolling to the bottom of the grid appends the next batch */
    static readonly PAGE = 240;

    @Input() size: NzSizeLDSType = 'default';
    @Input() placeholder = '';
    @Input() name = 'icon';
    @Input() disabled = false;
    /** Restrict the offered styles, e.g. ['solid'] */
    @Input() styles: FaStyle[] = FA_STYLES;
    /** Offer the color row; off when the host stores the color elsewhere */
    @Input() showColors = true;

    readonly colors = ICON_COLORS;

    /** The panel is right-aligned under the field's trigger and grows to the field's width */
    @ViewChild('field', {read: ElementRef, static: true}) fieldEl!: ElementRef<HTMLElement>;

    value = '';
    /** icon classes of {@link value} without the color class */
    cls = '';
    /** color class carried by {@link value}, or null */
    color: IconColor | null = null;
    open = false;
    keyword = '';
    /** Solid first: it is what menus and buttons use; the other styles stay one click away */
    style: FaStyle | '' = 'solid';
    panelWidth = 420;
    loading = false;
    error = '';
    total = 0;
    results: FaIconOption[] = [];

    private hits: FaIconOption[] = [];
    private all: FaIconOption[] = [];
    private onChange: (v: string) => void = () => {};
    private onTouched: () => void = () => {};

    constructor(private icons: FaIconService, private cdr: ChangeDetectorRef) {
    }

    // ------------------------------------------------------------------ ControlValueAccessor

    writeValue(v: string): void {
        this.apply(v || '');
        this.cdr.markForCheck();
    }

    private apply(v: string): void {
        this.value = v;
        const parts = splitIconColor(v);
        this.cls = parts.icon;
        this.color = parts.color;
    }

    registerOnChange(fn: (v: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
        this.disabled = disabled;
    }

    // ------------------------------------------------------------------ input

    typed(v: string): void {
        this.apply(v);
        this.onChange(v);
    }

    clear(): void {
        this.typed('');
    }

    touched(): void {
        this.onTouched();
    }

    // ------------------------------------------------------------------ popover

    onOpenChange(open: boolean): void {
        this.open = open;
        if (!open) {
            this.onTouched();
            return;
        }
        this.panelWidth = Math.max(420, this.fieldEl.nativeElement.offsetWidth);
        if (this.all.length) {
            this.filter();
            return;
        }
        this.loading = true;
        this.error = '';
        this.icons.load().then(all => {
            this.all = all.filter(o => this.styles.includes(o.style as FaStyle));
            this.filter();
        }).catch(() => {
            this.error = 'assets/font-awesome/icons.json';
        }).finally(() => {
            this.loading = false;
            this.cdr.markForCheck();
        });
    }

    setStyle(style: FaStyle | ''): void {
        this.style = style;
        this.filter();
    }

    filter(): void {
        const kw = this.keyword.trim().toLowerCase();
        this.hits = this.all.filter(o => (!this.style || o.style === this.style) && FaIconService.matches(o, kw));
        this.total = this.hits.length;
        this.results = this.hits.slice(0, IconPickerComponent.PAGE);
    }

    /** Appends the next batch once the grid is scrolled near its end */
    onGridScroll(ev: Event): void {
        const el = ev.target as HTMLElement;
        if (this.results.length < this.total && el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
            this.results = this.hits.slice(0, this.results.length + IconPickerComponent.PAGE);
        }
    }

    pick(opt: FaIconOption): void {
        this.typed(this.join(opt.cls, this.showColors ? this.color : null));
        this.open = false;
        this.onTouched();
    }

    /** Recolors the current value in place; with no icon chosen yet the color waits for the next pick */
    setColor(color: IconColor | null): void {
        this.color = color;
        if (this.cls) this.typed(this.join(this.cls, color));
    }

    private join(icon: string, color: IconColor | null): string {
        return color ? `${icon} ${color.cls}` : icon;
    }

    get version(): string {
        return this.icons.version;
    }
}
