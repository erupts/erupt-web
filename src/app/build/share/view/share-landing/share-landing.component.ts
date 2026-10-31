import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {WindowModel} from "@shared/model/window.model";
import {ShareSession} from "@shared/model/share-session";
import {ShareApiService, ShareMeta, ShareSession as ShareSessionVo} from "../../service/share-api.service";
import {MenuTypeEnum} from "@shared/model/erupt-menu";
import {generateMenuPath} from "@shared/util/erupt.util";

/**
 * Entry of a public link: shows what the link is, asks the password when one is set, then
 * trades the code for a session and moves on to the target's own route with that token.
 */
@Component({
    standalone: false,
    selector: "erupt-share-landing",
    templateUrl: "./share-landing.component.html",
    styleUrls: ["./share-landing.component.less"]
})
export class ShareLandingComponent implements OnInit {

    code: string;
    meta: ShareMeta | null = null;
    loading = true;
    opening = false;
    password = "";
    error: string | null = null;
    title = WindowModel.title;
    logoPath = WindowModel.loginLogoPath;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private shareApi: ShareApiService) {
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.code = params["code"];
            this.loading = true;
            this.shareApi.meta(this.code).subscribe({
                next: res => {
                    this.meta = res.data;
                    this.loading = false;
                },
                error: () => this.loading = false
            });
        });
    }

    open(): void {
        if (this.opening) return;
        this.opening = true;
        this.error = null;
        this.shareApi.exchange(this.code, this.meta?.requirePassword ? this.password : null).subscribe({
            next: res => {
                this.opening = false;
                if (!res.data) {
                    this.error = res.message;
                    return;
                }
                // Kept apart from any login token in this browser: the share routes send it, nothing else does
                ShareSession.set(this.code, res.data.token);
                this.router.navigateByUrl(this.targetRoute(res.data)).then();
            },
            error: () => this.opening = false
        });
    }

    // Where the target renders: a form has its own page, a template page is framed with the share
    // token, any other menu opens the same page the admin layout would, under /share
    private targetRoute(session: ShareSessionVo): string {
        if (session.type === "FORM") return ShareSession.ROUTE + "form/" + session.target;
        if (session.menuType === MenuTypeEnum.tpl || session.menuType === MenuTypeEnum.mtpl) return ShareSession.ROUTE + "page/" + session.target;
        return "/share" + generateMenuPath(session.menuType, session.target);
    }
}
