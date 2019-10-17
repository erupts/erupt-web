/**
 * Created by liyuepeng on 10/16/19.
 */
import { Injectable } from "@angular/core";
import { deepCopy, LazyService } from "@delon/util";

@Injectable()
export class UtilsService {

  constructor(private lazy: LazyService) {
  }

  analyseHtml(content: string): string {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(`<html><body>${content}</body></html>`, "text/html");
    let body = xmlDoc.getElementsByTagName("body")[0];
    //script脚本再页面渲染完成后执行
    setTimeout(() => {
      let scripts = xmlDoc.getElementsByTagName("script");
      for (let i = 0; i < scripts.length; i++) {
        let script = scripts[i];
        let src = script.getAttribute("src");
        if (src) {
          this.loadScript(src).then();
        } else {
          setTimeout(function() {
            eval(script.innerHTML);
          }, 100);
        }
      }
    }, 200);
    return body.getElementsByTagName("template")[0].innerHTML;
  }

  async loadScript(src) {
    await this.lazy.loadScript(src).then();
  }

}