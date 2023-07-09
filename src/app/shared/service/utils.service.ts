/**
 * Created by liyuepeng on 10/16/19.
 */
import {Injectable} from "@angular/core";
import {LazyService} from "@delon/util";

@Injectable()
export class UtilsService {

  constructor(private lazy: LazyService) {
  }

  async loadScript(src: string) {
    await this.lazy.loadScript(src).then(res => res);
  }

  async loadStyle(src: string) {
    await this.lazy.loadStyle(src).then(res => res);
  }

}
