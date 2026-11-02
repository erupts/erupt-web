export interface PrintPageConfig {
    paperSize: string;  // paper size
    orientation: string;  // paper orientation
    marginTop: number;  // top margin (mm)
    marginRight: number;  // right margin (mm)
    marginBottom: number;  // bottom margin (mm)
    marginLeft: number;  // left margin (mm)
}

export enum PaperSize {
    A4 = 'A4',
    A3 = 'A3',
    A5 = 'A5',
    LETTER = 'Letter',
    AUTO = 'Custom'
}

export enum PaperOrientation {
    PORTRAIT = 'portrait',
    LANDSCAPE = 'landscape'
}

// Where a field label sits in the built-in print form
export enum PrintLabelLayout {
    VERTICAL = 'vertical',
    HORIZONTAL = 'horizontal'
}

// Settings of the built-in print preview, adjusted right before printing
export interface BuiltinPrintConfig {
    layout: PrintLabelLayout;
    col: number;
    bordered: boolean;
    borderColor: string;
    fontSize: number;  // px
    showTitle: boolean;
    paperSize: PaperSize;
    orientation: PaperOrientation;
    margin: number;  // mm
}
