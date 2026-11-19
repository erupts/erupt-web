import {Inject, Injectable, Injector} from "@angular/core";
import {ScopeStore} from "@shared/service/scope.service";
import {Router} from "@angular/router";
import {
    HttpErrorResponse,
    HttpHandler,
    HttpHeaderResponse,
    HttpInterceptor,
    HttpProgressEvent,
    HttpRequest,
    HttpResponse,
    HttpSentEvent,
    HttpUserEvent
} from "@angular/common/http";
import {Observable, of, throwError} from "rxjs";
import {catchError, map, mergeMap} from "rxjs/operators";
import {environment} from "@env/environment";
import {safeJsonParse} from "./safe-json";
import {EruptApiModel, PromptWay, Status} from "../../build/erupt/model/erupt-api.model";
import {CacheService} from "@delon/cache";
import {GlobalKeys} from "@shared/model/erupt-const";
import {DA_SERVICE_TOKEN, TokenService} from "@delon/auth";
import {ShareSession} from "@shared/model/share-session";
import {NzModalService} from "ng-zorro-antd/modal";
import {NzNotificationService} from "ng-zorro-antd/notification";
import {NzMessageService} from "ng-zorro-antd/message";
import {I18NService} from "../i18n/i18n.service";
import {ReloginService} from "../../layout/erupt/component/relogin/relogin.service";
import {SessionService} from "@shared/service/session.service";
import {PageAccountService} from "@shared/service/page-account.service";

/**
 * Default HTTP interceptor.See registration for details `app.module.ts`
 */
@Injectable()
export class DefaultInterceptor implements HttpInterceptor {

    // Set by the first call the session token got through. A token refused before that was dead
    // when the page loaded: nothing is on screen to keep (a refresh can be stuck in a route guard
    // waiting on its very first request), so that goes to the login page instead of the dialog.
    private sessionLive = false;

    private static readonly LOGOUT_API = "erupt-api/logout";

    constructor(private injector: Injector,
                @Inject(NzModalService)
                private modal: NzModalService,
                @Inject(NzNotificationService)
                private notify: NzNotificationService,
                @Inject(NzMessageService)
                private msg: NzMessageService,
                @Inject(DA_SERVICE_TOKEN)
                private tokenService: TokenService,
                private router: Router,
                @Inject(NzNotificationService)
                private notification: NzNotificationService,
                private i18n: I18NService,
                private cacheService: CacheService) {
    }


    private goTo(url: string) {
        setTimeout(() => this.injector.get(Router).navigateByUrl(url));
    }

    private handleData(event: HttpResponse<any> | HttpErrorResponse): Observable<any> {
        // this.checkStatus(event)
        // Business logic: some common operations
        switch (event.status) {
            case 200:
                // Business-level error handling, assuming the REST API has a unified response format
                // (i.e., both success and error responses share the same data shape). For example:
                //  Error:   { success: false, message: 'invalid parameter' }
                //  Success: { success: true, data: {  } }
                // The code snippet below can be used directly in that case
                if (event instanceof HttpResponse) {
                    const body: any = event.body;
                    // If the response body is an EruptApi object (text/blob responses stay untouched)
                    if (body && typeof body === "object" && "status" in body && "message" in body && "promptWay" in body) {
                        let eruptApiBody = <EruptApiModel>body;
                        if (eruptApiBody.message) {
                            switch (eruptApiBody.promptWay) {
                                case PromptWay.NONE:
                                    break;
                                case PromptWay.DIALOG:
                                    switch (eruptApiBody.status) {
                                        case Status.INFO:
                                            this.modal.info({
                                                nzTitle: eruptApiBody.message
                                            });
                                            break;
                                        case Status.SUCCESS:
                                            this.modal.success({
                                                nzTitle: eruptApiBody.message
                                            });
                                            break;
                                        case Status.WARNING:
                                            this.modal.warning({
                                                nzTitle: eruptApiBody.message
                                            });
                                            break;
                                        case Status.ERROR:
                                            this.modal.error({
                                                nzTitle: eruptApiBody.message
                                            });
                                            break;
                                    }
                                    break;
                                case PromptWay.MESSAGE:
                                    switch (eruptApiBody.status) {
                                        case Status.INFO:
                                            this.msg.info(eruptApiBody.message);
                                            break;
                                        case Status.SUCCESS:
                                            this.msg.success(eruptApiBody.message);
                                            break;
                                        case Status.WARNING:
                                            this.msg.warning(eruptApiBody.message);
                                            break;
                                        case Status.ERROR:
                                            this.msg.error(eruptApiBody.message);
                                            break;
                                    }
                                    break;
                                case PromptWay.NOTIFY:
                                    switch (eruptApiBody.status) {
                                        case Status.INFO:
                                            this.notify.info(
                                                eruptApiBody.message,
                                                null,
                                                {nzDuration: 0}
                                            );
                                            break;
                                        case Status.SUCCESS:
                                            this.notify.success(
                                                eruptApiBody.message,
                                                null,
                                                {nzDuration: 0}
                                            );
                                            break;
                                        case Status.WARNING:
                                            this.notify.warning(
                                                eruptApiBody.message,
                                                null,
                                                {nzDuration: 0}
                                            );
                                            break;
                                        case Status.ERROR:
                                            this.notify.error(
                                                eruptApiBody.message,
                                                null,
                                                {nzDuration: 0}
                                            );
                                            break;
                                    }
                                    break;
                            }
                        }
                        if (eruptApiBody.promptWay != PromptWay.NONE && (eruptApiBody.status === Status.WARNING || eruptApiBody.status === Status.ERROR)) {
                            return throwError(() => eruptApiBody);
                        }
                    }
                }
                return of(event);
            case 401: // Not logged in
                // A share session has ended: the visitor has no account to log in with, the link is the way back
                if (ShareSession.active()) {
                    ShareSession.clear();
                    this.msg.warning(this.i18n.fanyi("share.session_expired"));
                    return throwError(() => event);
                }
                // logging out of a session that already ended: SessionService leaves either way
                if ((event.url || "").indexOf(DefaultInterceptor.LOGOUT_API) !== -1) {
                    return throwError(() => event);
                }
                // a refresh can be refused while its first navigation is still running: return to
                // where it was going, not to the "/" the router reports until it lands
                const backPath = this.router.currentNavigation()?.finalUrl?.toString()
                    || this.router.currentNavigation()?.extractedUrl?.toString()
                    || this.router.url;
                if (!backPath.startsWith("/passport")) {
                    this.cacheService.set(GlobalKeys.loginBackPath, backPath);
                }
                // nothing worth keeping on screen (the shell never came up, or a lock screen covers it):
                // straight to the login page
                if (event.url.indexOf("erupt-api/menu") !== -1 || !this.sessionLive
                    || this.injector.get(SessionService).locked) {
                    this.goTo("/passport/login");
                    this.modal.closeAll();
                    this.tokenService.clear();
                } else {
                    if (this.tokenService.get().token) {
                        this.modal.confirm({
                            nzTitle: this.i18n.fanyi("login_expire.tip"),
                            nzOkText: this.i18n.fanyi("login_expire.retry"),
                            nzOnOk: () => {
                                this.goTo("/passport/login");
                                this.modal.closeAll();
                            },
                            nzOnCancel: () => {
                                this.modal.closeAll();
                            }
                        });
                    } else {
                        this.goTo("/passport/login");
                    }
                }
                break
            case 404:
                if (event.url.indexOf("/form-value") != -1) {
                    break;
                }
                this.goTo("/exception/404");
                break
            case 403: //No authority
                if (event.url.indexOf("/erupt-api/build/") != -1) {
                    this.goTo("/exception/403");
                } else {
                    this.modal.warning({
                        nzTitle: this.i18n.fanyi("none_permission")
                    });
                }
                break
            case 500:
                event = <HttpErrorResponse>event;
                if (event.url.indexOf("/erupt-api/build/") != -1) {
                    this.router.navigate(["/exception/500"], {
                        queryParams: {
                            message: event.error.message
                        }
                    });
                } else {
                    this.modal.error({
                        nzTitle: event.error.message,
                        // nzContent: event.error.message
                    });
                    Object.assign(event, {
                        status: 200, ok: true, body: {
                            status: Status.ERROR
                        }
                    });
                }
                break
            default:
                if (event instanceof HttpErrorResponse) {
                    console.warn("Unknown errors, mostly due to unresponsive backend or invalid configuration", event);
                    this.msg.error(event.message);
                }
                break
        }
        return throwError(() => event);
    }

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<| HttpSentEvent
        | HttpHeaderResponse
        | HttpProgressEvent
        | HttpResponse<any>
        | HttpUserEvent<any>> {
        // Uniformly prepend the server-side base URL prefix
        let url = req.url;
        if (!url.startsWith("https://") && !url.startsWith("http://") && !url.startsWith("//")) {
            url = environment.api.baseUrl + url;
        }
        // Receive JSON responses as text and parse them ourselves, so 64-bit ids
        // beyond Number.MAX_SAFE_INTEGER are kept as strings instead of losing precision
        const expectJson = req.responseType === "json";
        let headers = req.headers.set("lang", this.i18n.currentLang || '');
        // the scope picks every erupt-api call runs in; the server verifies their signatures
        const scope = ScopeStore.header();
        if (scope && url.indexOf("erupt-api") !== -1 && !headers.has(ScopeStore.HEADER)) {
            headers = headers.set(ScopeStore.HEADER, scope);
        }
        const newReq = req.clone({
            url: url,
            headers: headers,
            ...(expectJson ? {responseType: "text" as const} : {})
        });
        const send = (r: HttpRequest<any>) => next.handle(r).pipe(
            map((event: any) => {
                if (expectJson && event instanceof HttpResponse && typeof event.body === "string") {
                    try {
                        return event.clone({body: safeJsonParse(event.body)});
                    } catch (ignore) {
                        // malformed JSON: keep the raw text body
                    }
                }
                return event;
            }),
            mergeMap((event: any) => {
                if (event instanceof HttpResponse && event.ok && r.headers.has(this.tokenService.options.token_send_key)) {
                    this.sessionLive = true;
                }
                // Allow unified request error handling — needed when a business error returns HTTP 200
                if (event instanceof HttpResponse && event.status === 200)
                    return this.handleData(event);
                // If everything is fine, proceed with subsequent operations
                return of(event);
            }),
            catchError((err: HttpErrorResponse) => {
                // The error body arrives as text now; restore it to an object for downstream handling
                if (expectJson && err instanceof HttpErrorResponse && typeof err.error === "string") {
                    try {
                        err = new HttpErrorResponse({
                            error: safeJsonParse(err.error),
                            headers: err.headers,
                            status: err.status,
                            statusText: err.statusText,
                            url: err.url || undefined
                        });
                    } catch (ignore) {
                    }
                }
                // If it is a business error (EruptApiModel), throw it directly
                if (err && typeof err === 'object' && 'status' in err && 'message' in err && 'promptWay' in err) {
                    return throwError(() => err);
                }
                // An expired session that can sign back in on the spot: hold the request until it has,
                // then send it again, so the caller never sees the 401 and its UI state stays intact
                if (err instanceof HttpErrorResponse && err.status === 401 && this.canRelogin(r, err)) {
                    const key = this.tokenService.options.token_send_key;
                    const resend = (token: string) => send(r.clone({setHeaders: {[key]: token}}));
                    // sent with the old token but answered after the dialog already renewed it
                    const current = this.tokenService.get();
                    if (current.token !== r.headers.get(key)) {
                        if (this.injector.get(PageAccountService).owns(current)) return resend(current.token);
                        // another account signed in meanwhile (PageAccountService tells the user): the
                        // request is this page's account's and must not go out as someone else
                        return throwError(() => err);
                    }
                    return this.injector.get(ReloginService).wait().pipe(
                        mergeMap(token => token
                            ? resend(token)
                            // closed without signing in: the caller gets its error, no second prompt
                            : throwError(() => err))
                    );
                }
                // For other HTTP errors, delegate to handleData
                return this.handleData(err);
            })
        );
        return send(newReq);
    }

    private canRelogin(req: HttpRequest<any>, err: HttpErrorResponse): boolean {
        return this.sessionLive
            && !!this.tokenService.get().token
            // the dialog would sit under the lock screen, out of reach
            && !this.injector.get(SessionService).locked
            && (err.url || "").indexOf(DefaultInterceptor.LOGOUT_API) === -1
            // only our own calls, which went out carrying the session token
            && req.headers.has(this.tokenService.options.token_send_key)
            && !ShareSession.active()
            // the menu failing means the shell cannot come up: nothing on screen to keep
            && (err.url || "").indexOf("erupt-api/menu") === -1
            && !this.router.url.startsWith("/passport")
            && this.injector.get(ReloginService).supported();
    }
}
