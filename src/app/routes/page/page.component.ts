import {Component, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {DataService} from "../../erupt/service/data.service";
import {UtilsService} from "../../erupt/service/utils.service";

@Component({
    selector: "app-page",
    templateUrl: "./page.component.html",
    styleUrls: ["./page.component.less"]
})
export class PageComponent implements OnInit, OnDestroy {

    constructor(public route: ActivatedRoute, public dataService: DataService, private util: UtilsService) {
    }

    page: string;

    url: string;

    targetUrl: string;

    html: string;

    exitJs: string = "";

    spin: boolean = false;

    ngOnInit() {
        this.route.queryParamMap.subscribe(map => {
            this.url = null;
            this.targetUrl = null;
            if (map.has("tpl")) {
                this.dataService.getEruptTpl(map.get("tpl")).subscribe((res) => {
                    alert(res);
                    console.log(res);
                    let tpl = this.util.analyseHtml(res);
                    this.html = tpl.html;
                    setTimeout(() => {
                        eval(tpl.js)
                    }, 200);
                    this.exitJs += tpl.exitJs;
                });
            } else if (map.has("site")) {
                let target = map.get("target");
                if (target === "blank") {
                    this.targetUrl = map.get("site");
                    window.open(this.targetUrl);
                } else {
                    this.spin = true;
                    this.url = map.get("site");
                }
            } else {
                this.url = "page/home.html";
            }
        });
    }


    iframeLoad() {
        this.spin = false;
    }

    ngOnDestroy(): void {
        if (this.exitJs) {
            eval(this.exitJs);
        }
    }

}
