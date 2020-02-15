/**
 * Created by liyuepeng on 10/16/19.
 */
import {Injectable} from "@angular/core";
import {deepCopy, LazyService} from "@delon/util";

@Injectable()
export class UtilsService {

    constructor(private lazy: LazyService) {
    }

    analyseHtml(content: string): {
        html: string,
        js: string,
        exitJs: string
    } {
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(`<html><body>${content}</body></html>`, "text/html");
        let body = xmlDoc.getElementsByTagName("body")[0];
        let html = "";
        // link
        let links = body.getElementsByTagName("link");
        for (let i = 0; i < links.length; i++) {
            let link = links[i];
            if (link.getAttribute("rel") === "stylesheet") {
                this.loadStyle(link.getAttribute("href")).then();
            }
        }
        //style
        let styles = body.getElementsByTagName("style");
        for (let i = 0; i < styles.length; i++) {
            let style = styles[i];
            html += style.outerHTML;
        }
        //script脚本再页面渲染完成后执行
        let scripts = xmlDoc.getElementsByTagName("script");
        let js = "";
        let exitJs = "";
        for (let i = 0; i < scripts.length; i++) {
            let script = scripts[i];
            let src = script.getAttribute("src");
            let rel = script.getAttribute("rel");
            if (src) {
                this.loadScript(src).then();
            } else if (rel === "exit") {
                exitJs = script.innerHTML;
            } else {
                js += script.innerHTML;
            }
        }
        html += body.getElementsByTagName("template")[0].innerHTML;
        return {
            html: html,
            js: js,
            exitJs: exitJs
        };
    }

    async loadScript(src) {
        await this.lazy.loadScript(src).then(res => res);
    }

    async loadStyle(src) {
        await this.lazy.loadStyle(src).then(res => res);
    }

}