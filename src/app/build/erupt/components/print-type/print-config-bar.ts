import {Component, Input} from "@angular/core";
import {BuiltinPrintConfig, PaperOrientation, PaperSize, PrintLabelLayout} from "@shared/model/erupt-print";
import {saveBuiltinPrintConfig} from "@shared/util/print.util";

// Settings bar of the built-in print preview; edits the given config in place and remembers it
@Component({
    standalone: false,
    selector: "erupt-print-config-bar",
    templateUrl: "./print-config-bar.html",
    styleUrls: ["./print-config-bar.less"]
})
export class PrintConfigBarComponent {

    @Input() config: BuiltinPrintConfig;

    readonly PrintLabelLayout = PrintLabelLayout;

    readonly PaperOrientation = PaperOrientation;

    readonly paperSizes = Object.values(PaperSize);

    readonly colOptions = [1, 2, 3, 4];

    save() {
        saveBuiltinPrintConfig(this.config);
    }

}
