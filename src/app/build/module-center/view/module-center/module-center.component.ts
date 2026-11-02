import {Component, OnInit, Optional} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd/message';
import {I18NService} from '@core';
import {MODULE_GROUPS} from '@shared/model/erupt-menu';
import {LayoutEruptComponent} from '../../../../layout/erupt/erupt.component';
import {Status} from '../../../erupt/model/erupt-api.model';
import {ModuleCenterService, ModuleVo} from '../../module-center.service';

/** The modules of one group, as a section of the page. */
interface Section {
    group: string;
    modules: ModuleVo[];
}

/**
 * The module center: every installed module by purpose, with what it is for, its documentation and
 * a switch for its menus. A newcomer reads the installation here as a map.
 */
@Component({
    selector: 'erupt-module-center',
    templateUrl: './module-center.component.html',
    styleUrls: ['./module-center.component.less'],
    standalone: false
})
export class ModuleCenterComponent implements OnInit {

    modules: ModuleVo[] = [];

    filter = '';

    loading = true;

    // modules whose switch is on its way to the server
    busy = new Set<string>();

    constructor(private api: ModuleCenterService,
                private msg: NzMessageService,
                public i18n: I18NService,
                @Optional() private layout: LayoutEruptComponent) {
    }

    ngOnInit(): void {
        this.api.modules().subscribe(res => {
            this.modules = res || [];
            this.loading = false;
        });
    }

    t(key: string): string {
        return this.i18n.fanyi('module.' + key);
    }

    groupTitle(group: string): string {
        return this.t('group.' + group.toLowerCase());
    }

    /** Sections in the groups' order, a module without a group last, the filter applied. */
    sections(): Section[] {
        const text = this.filter.trim().toLowerCase();
        const shown = this.modules.filter(m => !text || m.name.toLowerCase().includes(text)
            || (m.description || '').toLowerCase().includes(text));
        return [...MODULE_GROUPS, 'OTHER']
            .map(group => ({group, modules: shown.filter(m => (m.group || 'OTHER') === group)}))
            .filter(s => s.modules.length > 0);
    }

    /** The documentation link with the reader's language filled in: docs.erupt.xyz speaks zh and en. */
    docs(module: ModuleVo): string | null {
        if (!module.docs) return null;
        const lang = (this.i18n.currentLang || '').startsWith('zh') ? 'zh' : 'en';
        return module.docs.replace('{lang}', lang);
    }

    toggle(module: ModuleVo, value: boolean): void {
        this.busy.add(module.name);
        this.api.enabled(module.name, value).subscribe({
            next: res => {
                this.busy.delete(module.name);
                if (res && res.status !== Status.SUCCESS) {
                    if (res.message) this.msg.error(res.message);
                    return;
                }
                module.enabled = value;
                // the sidebar shows the change at once, the session's menu cache was rebuilt on the server
                this.layout?.loadMenu().subscribe();
            },
            error: () => this.busy.delete(module.name)
        });
    }

}
