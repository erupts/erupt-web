import {Injectable} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd/message';
import {I18NService} from '@core';
import {copyText} from '@shared/util/clipboard.util';

/** Copies text for the user and says how it went; see copyText for the http fallback. */
@Injectable({providedIn: 'root'})
export class ClipboardService {

    constructor(private msg: NzMessageService, private i18n: I18NService) {
    }

    /**
     * @param success the message shown on success; undefined for the stock one, null for none
     * @return whether the text got on the clipboard; the user has already been told otherwise
     */
    copy(text: string, success?: string | null): Promise<boolean> {
        return copyText(text).then(ok => {
            if (ok) {
                if (success !== null) this.msg.success(success ?? this.i18n.fanyi('global.copy_success'));
            } else {
                this.msg.error(this.i18n.fanyi('global.copy_failed'));
            }
            return ok;
        });
    }

}
