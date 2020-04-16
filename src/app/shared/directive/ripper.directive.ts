import {Directive, HostListener} from '@angular/core';

@Directive({
    selector: '[ripper]'
})
export class RipperDirective {

    constructor() {
    }

    @HostListener('click', ['$event.currentTarget'])
    private onClick(ele) {
        ele.style.position = "relative";
        ele.style.overflow = "hidden";
        let spanRipper = document.createElement("span");
        spanRipper.className = "ripple";
        spanRipper.style.left = ele.offsetX + "px";
        spanRipper.style.top = ele.offsetY + "px";
        ele.appendChild(spanRipper);
        setTimeout(() => {
            ele.removeChild(spanRipper)
        }, 800);
    }

}
