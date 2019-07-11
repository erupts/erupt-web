import { Inject, Injectable, Injector } from "@angular/core";
import { Router } from "@angular/router";
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
import { Observable, of, throwError } from "rxjs";
import { catchError, mergeMap } from "rxjs/operators";
import { NzMessageService, NzModalService, NzNotificationService } from "ng-zorro-antd";
import { _HttpClient } from "@delon/theme";
import { environment } from "@env/environment";
import { EruptApiModel, PromptWay, Status } from "../../erupt/model/erupt-api.model";
import { CacheService } from "@delon/cache";
import { GlobalKeys } from "../../erupt/model/erupt-const";

/**
 * 默认HTTP拦截器，其注册细节见 `app.module.ts`
 */
@Injectable()
export class DefaultInterceptor implements HttpInterceptor {
  constructor(private injector: Injector,
              @Inject(NzModalService)
              private modal: NzModalService,
              @Inject(NzNotificationService)
              private notify: NzNotificationService,
              @Inject(NzMessageService)
              private msg: NzMessageService,
              private router: Router,
              private cacheService: CacheService) {
  }


  private goTo(url: string) {
    setTimeout(() => this.injector.get(Router).navigateByUrl(url));
  }

  private handleData(event: HttpResponse<any> | HttpErrorResponse): Observable<any> {
    // 可能会因为 `throw` 导出无法执行 `_HttpClient` 的 `end()` 操作
    this.injector.get(_HttpClient).end();
    // 业务处理：一些通用操作
    switch (event.status) {
      case 200:
        // 业务层级错误处理，以下是假定restful有一套统一输出格式（指不管成功与否都有相应的数据格式）情况下进行处理
        // 例如响应内容：
        //  错误内容：{ success: false, message: '非法参数' }
        //  正确内容：{ success: true, data: {  } }
        // 则以下代码片断可直接适用
        if (event instanceof HttpResponse) {
          const body: any = event.body;
          //如果返回对象为EruptApi
          if ("status" in body && "message" in body && "errorIntercept" in body) {
            let eruptApiBody = <EruptApiModel>body;
            if (eruptApiBody.message) {
              switch (eruptApiBody.promptWay) {
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
                        { nzDuration: 0 }
                      );
                      break;
                    case Status.SUCCESS:
                      this.notify.success(
                        eruptApiBody.message,
                        null,
                        { nzDuration: 0 }
                      );
                      break;
                    case Status.WARNING:
                      this.notify.warning(
                        eruptApiBody.message,
                        null,
                        { nzDuration: 0 }
                      );
                      break;
                    case Status.ERROR:
                      this.notify.error(
                        eruptApiBody.message,
                        null,
                        { nzDuration: 0 }
                      );
                      break;
                  }
                  break;
              }
            }
            if (eruptApiBody.errorIntercept && eruptApiBody.status == Status.ERROR) {
              // 继续抛出错误中断后续所有 Pipe、subscribe 操作，因此：this.http.get('/').subscribe() 并不会触发
              return throwError({});
            }
          }
          // 重新修改 `body` 内容为 `response` 内容，对于绝大多数场景已经无须再关心业务状态码
          // return of(new HttpResponse(Object.assign(event, { body: body.response })));
        }
        break;
      case 401: // 未登录状态码
        this.cacheService.set(GlobalKeys.loginBackPath, this.router.url);
        this.goTo("/passport/login");
        break;
      case 404:
        this.goTo("/layout/404");
        break;
      case 403: //无权限
        this.goTo("/layout/403");
        break;
      case 500:
        event = <HttpErrorResponse>event;
        this.modal.error({
          nzTitle: "Error",
          nzContent: event.error.message
        });
        return throwError({});
      // this.goTo("/layout/500");
      // break;
      default:
        if (event instanceof HttpErrorResponse) {
          console.warn("未可知错误，大部分是由于后端无响应或无效配置引起", event);
          this.msg.error(event.message);
        }
        break;
    }
    return of(event);
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<| HttpSentEvent
    | HttpHeaderResponse
    | HttpProgressEvent
    | HttpResponse<any>
    | HttpUserEvent<any>> {
    // 统一加上服务端前缀
    let url = req.url;
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      url = environment.SERVER_URL + url;
    }

    const newReq = req.clone({
      url: url
    });
    return next.handle(newReq).pipe(
      mergeMap((event: any) => {
        // 允许统一对请求错误处理，这是因为一个请求若是业务上错误的情况下其HTTP请求的状态是200的情况下需要
        if (event instanceof HttpResponse && event.status === 200)
          return this.handleData(event);
        // 若一切都正常，则后续操作
        return of(event);
      }),
      catchError((err: HttpErrorResponse) => this.handleData(err))
    );
  }
}
