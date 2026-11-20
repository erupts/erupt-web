import {Inject, Injectable, Type} from "@angular/core";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";
import {NzModalRef, NzModalService} from "ng-zorro-antd/modal";
import {AsyncSubject, Observable} from "rxjs";
import {UtilsService} from "@shared/service/utils.service";
import {EruptAppData} from "@shared/model/erupt-app.model";

// One sign-in dialog for an expired session, however many requests come back 401 at once
@Injectable({providedIn: "root"})
export class ReloginService {

    // The dialog, registered by LayoutModule. Referencing it from here would pull the component into
    // every build that reaches the http interceptor (the unit tests among them) without the module
    // that declares it; with no layout loaded there is nothing on screen to keep anyway.
    component: Type<unknown> = null;

    private ref: NzModalRef = null;

    private result: AsyncSubject<string | null>;

    constructor(private modal: NzModalService,
                private utilsService: UtilsService,
                @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    // Only a platform account known by name can sign back in on the spot; tenant sessions
    // and sites with their own login page keep going to that page
    supported(): boolean {
        return !!this.component
            && !!this.tokenService.get()?.["account"]
            && !this.utilsService.isTenantToken()
            && !EruptAppData.get().loginPagePath;
    }

    // Opens the dialog (once for every request that hit the expiry) and emits the new token,
    // or null when it was closed without signing in. An AsyncSubject also answers a request
    // that subscribes after the dialog closed.
    wait(): Observable<string | null> {
        if (!this.ref) {
            const result = this.result = new AsyncSubject<string | null>();
            this.ref = this.modal.create({
                nzContent: this.component,
                nzWidth: 360,
                nzCentered: true,
                nzFooter: null,
                nzClosable: true,
                nzMaskClosable: false,
                nzKeyboard: false
            });
            this.ref.afterClose.subscribe((token?: string) => {
                this.ref = null;
                result.next(token || null);
                result.complete();
            });
        }
        return this.result.asObservable();
    }

}
