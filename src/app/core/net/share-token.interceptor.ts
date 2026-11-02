import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {ALLOW_ANONYMOUS} from "@delon/auth";
import {ShareSession} from "@shared/model/share-session";

/**
 * On a share route every API call carries the share session instead of the login token, and
 * none of them is bounced to the login page: a visitor has no account. Registered ahead of the
 * delon auth interceptor, which then leaves these requests alone.
 */
@Injectable()
export class ShareTokenInterceptor implements HttpInterceptor {

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!ShareSession.active()) return next.handle(req);
        const token = ShareSession.token();
        return next.handle(req.clone({
            context: req.context.set(ALLOW_ANONYMOUS, true),
            setHeaders: token ? {token} : {}
        }));
    }
}
