import {Component, EventEmitter, Input, Output} from '@angular/core';
import {I18NService} from '@core';
import {isWidget, ReportDSL, ReportScreenStyle, ReportType, ScreenPanel} from "../../model/dashboard.model";
import {NUMBER_UNITS, NumberFormat, NumberUnit} from "../../model/number-format";
import {PropField, PropKind, widgetDef} from "../../model/screen-widget";
import {AlignKind, Axis} from "../../model/screen.util";

/**
 * The property panel of a data screen being edited: position, size and look of the selected report, and for
 * a widget everything it shows. It edits the report in place; the canvas binds the same object.
 */
@Component({
    selector: 'cube-screen-props',
    standalone: false,
    templateUrl: './cube-screen-props.html',
    styleUrl: './cube-screen-props.less'
})
export class CubeScreenProps {

    /** What is selected on the canvas: one report is edited in full, several can only be aligned */
    @Input() selection: ReportDSL[] = [];

    get report(): ReportDSL | null {
        return this.selection.length === 1 ? this.selection[0] : null;
    }

    /** Align the selection: several reports to one another, a single one to the canvas */
    @Output() align = new EventEmitter<AlignKind>();

    @Output() distribute = new EventEmitter<Axis>();

    /** Whether something selected belongs to a group */
    @Input() canUngroup = false;

    @Output() group = new EventEmitter<void>();

    @Output() ungroup = new EventEmitter<void>();

    readonly units = Object.values(NumberUnit).map(value => ({value, label: NUMBER_UNITS[value].mark}));

    get kpi(): boolean {
        return this.report?.type === ReportType.KPI;
    }

    /** How the figure of a KPI is written; created on first use, a report need not carry one */
    get format(): NumberFormat {
        this.report.ui ??= {};
        return this.report.ui['format'] ??= {};
    }

    /** The align buttons: each icon is the bars of two reports against the line they are brought to */
    readonly aligns: { kind: AlignKind; title: string; line: string; bars: string[] }[] = [
        {kind: AlignKind.LEFT, title: 'cube.screen.align.left', line: 'M2 2v12', bars: ['M4 4h8v3H4z', 'M4 9h5v3H4z']},
        {kind: AlignKind.CENTER, title: 'cube.screen.align.center', line: 'M8 2v12', bars: ['M3 4h10v3H3z', 'M5 9h6v3H5z']},
        {kind: AlignKind.RIGHT, title: 'cube.screen.align.right', line: 'M14 2v12', bars: ['M4 4h8v3H4z', 'M7 9h5v3H7z']},
        {kind: AlignKind.TOP, title: 'cube.screen.align.top', line: 'M2 2h12', bars: ['M4 4h3v8H4z', 'M9 4h3v5H9z']},
        {kind: AlignKind.MIDDLE, title: 'cube.screen.align.middle', line: 'M2 8h12', bars: ['M4 3h3v10H4z', 'M9 5h3v6H9z']},
        {kind: AlignKind.BOTTOM, title: 'cube.screen.align.bottom', line: 'M2 14h12', bars: ['M4 4h3v8H4z', 'M9 7h3v5H9z']},
    ];

    /** The distribute buttons: three bars with equal gaps */
    readonly distributes: { axis: Axis; title: string; bars: string[] }[] = [
        {axis: Axis.HORIZONTAL, title: 'cube.screen.distribute.horizontal', bars: ['M2 3h2v10H2z', 'M7 5h2v6H7z', 'M12 3h2v10h-2z']},
        {axis: Axis.VERTICAL, title: 'cube.screen.distribute.vertical', bars: ['M3 2h10v2H3z', 'M5 7h6v2H5z', 'M3 12h10v2H3z']},
    ];

    /** The frame was typed in: whoever draws the selection box must redraw it */
    @Output() frameChange = new EventEmitter<void>();

    /** A chart's data and chart options are edited in the report dialog */
    @Output() editData = new EventEmitter<ReportDSL>();

    readonly panels = Object.values(ScreenPanel);

    constructor(private i18n: I18NService) {
    }

    get widget(): boolean {
        return isWidget(this.report);
    }

    /** What the selected thing is: the widget's name, or the chart type */
    get kind(): string {
        return this.widget ? this.i18n.fanyi('cube.widget.' + this.report.type) : this.report.type;
    }

    get icon(): string {
        return widgetDef(this.report.type)?.icon || 'pie-chart';
    }

    get fields(): PropField[] {
        return widgetDef(this.report.type)?.fields || [];
    }

    /** The look of the report as an object on the screen; created on first use, a report need not carry one */
    get style(): ReportScreenStyle {
        this.report.ui ??= {};
        return this.report.ui['screen'] ??= {};
    }

    get opacity(): number {
        return this.style.opacity ?? 100;
    }

    set opacity(value: number) {
        this.style.opacity = value;
    }

    protected readonly PropKind = PropKind;
}
