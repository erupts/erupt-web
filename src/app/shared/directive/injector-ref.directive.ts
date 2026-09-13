import {Directive, Injector} from '@angular/core';

/**
 * Exposes the element injector of the host element so a template can be
 * instantiated *as if* it were declared there:
 *
 *   <ul nz-menu eruptInjector #inj="eruptInjector">
 *     <ng-template [ngTemplateOutlet]="tree" [ngTemplateOutletInjector]="inj.injector"></ng-template>
 *   </ul>
 *
 * Angular resolves DI for an embedded view from the template's DECLARATION
 * site, not from where it is rendered. A recursive `<ng-template>` declared
 * outside `nz-menu` / `nz-submenu` would therefore fail to inject
 * NzMenuService / NzSubmenuService; passing the real parent's injector fixes it.
 */
@Directive({
    standalone: false,
    selector: '[eruptInjector]',
    exportAs: 'eruptInjector'
})
export class InjectorRefDirective {
    constructor(public readonly injector: Injector) {
    }
}
