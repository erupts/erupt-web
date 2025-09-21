import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import SignaturePad from "signature_pad";
import {EruptFieldModel} from "../../model/erupt-field.model";

@Component({
    selector: 'erupt-signature-pad',
    templateUrl: './signature-pad.component.html',
    styleUrls: ['./signature-pad.component.less']
})
export class SignaturePadComponent implements AfterViewInit {

    @Input() eruptField: EruptFieldModel;

    @ViewChild('canvas', {static: false}) canvas!: ElementRef<HTMLCanvasElement>;
    signaturePad!: SignaturePad;

    ngAfterViewInit(): void {
        const canvas = this.canvas.nativeElement;
        // 高清屏比例
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        // 把物理像素设成 CSS 像素 * ratio，防止拉伸
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        const ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);
        this.signaturePad = new SignaturePad(canvas, {
            penColor: '#000',
            backgroundColor: '#fff',
            minWidth: 0.5,
            maxWidth: 2.5,
        });
    }


    save(): string {
        if (this.signaturePad.isEmpty()) {
            return null;
        }
        return this.signaturePad.toDataURL('image/png');
    }

    clear(): void {
        this.signaturePad.clear();
    }

    getSign(): string {
        if (this.signaturePad.isEmpty()) {
            return null;
        }
        return this.signaturePad.toDataURL('image/png');
    }

}
