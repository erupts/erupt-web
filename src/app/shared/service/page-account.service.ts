import {Inject, Injectable} from "@angular/core";
import {DA_SERVICE_TOKEN, ITokenModel, ITokenService} from "@delon/auth";
import {NzModalService} from "ng-zorro-antd/modal";
import {I18NService} from "@core";
import {ShareSession} from "@shared/model/share-session";

/**
 * The account this page instance runs as. Every tab shares one token in localStorage, so signing in
 * as someone else in another tab would silently carry this page's requests (an unsaved form, held
 * requests replayed after a relogin) under that account. This page follows sign-ins it makes itself
 * and stops for one made elsewhere: a notice that can only reload the page.
 */
@Injectable({providedIn: "root"})
export class PageAccountService {

    account: string = null;

    private noticed = false;

    constructor(@Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
                private modal: NzModalService,
                private i18n: I18NService) {
    }

    start(): void {
        // this tab's own writes (login page, relogin dialog, lock, logout) arrive here and never as a
        // storage event; the first emission is the token the page was loaded with
        this.tokenService.change().subscribe(() => this.account = this.currentAccount());
        window.addEventListener("storage", e => {
            if (e.key !== this.tokenService.options.store_key) return;
            const next = this.currentAccount();
            // another tab logging out is left to the next request's 401
            if (this.account && next && next !== this.account) this.switched(next);
        });
    }

    // whether a token can carry this page's requests
    owns(model: ITokenModel | null): boolean {
        return !!model && model["account"] === this.account;
    }

    private currentAccount(): string {
        return this.tokenService.get()?.["account"] || null;
    }

    private switched(account: string): void {
        // a share page runs on its own share session, not on the signed-in account
        if (this.noticed || ShareSession.active()) return;
        this.noticed = true;
        // the account is user data going into the dialog's HTML: escape it
        const escaped = document.createElement("span");
        escaped.textContent = account;
        this.modal.warning({
            nzTitle: this.i18n.fanyi("account_switched.title"),
            nzContent: this.i18n.fanyi("account_switched.tip").replace("{account}", `<b>${escaped.innerHTML}</b>`),
            nzOkText: this.i18n.fanyi("global.refresh"),
            nzOnOk: () => location.reload(),
            nzClosable: false,
            nzMaskClosable: false,
            // no nzZIndex: it lifts only the mask, which then covers the dialog's own button. A lock
            // screen needs no lifting over: the lock flag rides in the token, and the other tab's
            // token does not carry it, so the cover is gone with the switch
            nzKeyboard: false
        });
    }

}
