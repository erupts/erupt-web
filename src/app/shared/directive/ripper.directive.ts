import {Directive, HostListener, Input} from '@angular/core';

@Directive({
    selector: '[ripper]'
})
export class RipperDirective {

    constructor() {
    }

    @Input() color: string = "#eee";

    @Input() radius: number = 10;

    @Input() lifecycle: number = 1000;

    @HostListener('click', ['$event'])
    private onClick(e: any) {
        let ele = e.currentTarget;
        ele.style.position = "relative";
        ele.style.overflow = "hidden";
        let spanRipper = document.createElement("span");
        spanRipper.className = "ripple";
        spanRipper.style.left = e.offsetX + "px";
        spanRipper.style.top = e.offsetY + "px";
        if (this.radius) {
            spanRipper.style.width = this.radius + "px";
            spanRipper.style.height = this.radius + "px";
        }
        if (this.color) {
            spanRipper.style.background = this.color;
        }
        ele.appendChild(spanRipper);
        setTimeout(() => {
            ele.removeChild(spanRipper);
        }, this.lifecycle);
    }

}
