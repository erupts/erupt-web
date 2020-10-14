import {Directive, HostListener, Input} from '@angular/core';

@Directive({
    selector: '[ripper]'
})
export class RipperDirective {

    constructor() {
    }

    @Input() color: string;

    @Input() radius: number;

    @HostListener('click', ['$event'])
    private onClick(e) {
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
        }, 800);
    }

}
