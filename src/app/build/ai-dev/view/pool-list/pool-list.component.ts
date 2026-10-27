import {Component, OnDestroy, OnInit} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd/message';
import {Subject, timer} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {I18NService} from '@core';
import {SettingsService, TitleService} from '@delon/theme';
import {DataService} from '@shared/service/data.service';
import {ScopeService, ScopeStore} from '@shared/service/scope.service';
import {Status} from '../../../erupt/model/erupt-api.model';
import {AiDevService, DevProject, DevRow, Stage} from '../../ai-dev.service';
import {avatarTone, initial} from '../../ai-dev.util';

interface Group {
    key: string;
    stages: Stage[];
}

// how the list is grouped, top to bottom
const GROUPS: Group[] = [
    {key: 'pending', stages: ['DRAFT', 'REVIEW']},
    {key: 'running', stages: ['QUEUED', 'RUNNING', 'VERIFYING']},
    {key: 'acceptance', stages: ['ACCEPTANCE']},
    {key: 'failed', stages: ['FAILED']},
    {key: 'delivered', stages: ['DELIVERED']},
    {key: 'cancelled', stages: ['CANCELLED']}
];

const ACTIVE: Stage[] = ['QUEUED', 'RUNNING', 'VERIFYING'];

const PRIORITY = ['HIGH', 'MEDIUM', 'LOW'];

const VIEW_KEY = 'erupt-ai-dev.pool.view';

// finished columns would only grow: the latest first, the rest one click away
const BOARD_LIMIT = 20;

@Component({
    standalone: false,
    selector: 'app-ai-dev-pool-list',
    templateUrl: './pool-list.component.html',
    styleUrls: ['../ai-dev.less', './pool-list.component.less']
})
export class PoolListComponent implements OnInit, OnDestroy {

    readonly initial = initial;
    readonly avatarTone = avatarTone;
    readonly page = AiDevService.page;

    projects: DevProject[] = [];
    project: DevProject | null = null;
    rows: DevRow[] = [];
    loading = true;
    filter: 'all' | 'mine' | 'review' = 'all';
    keyword = '';
    readonly tabs = ['all', ...GROUPS.map(g => g.key)];
    tab = 'all';
    // table or board, remembered per browser
    mode: 'table' | 'board' = 'table';
    // board columns opened past their first cards
    expanded: { [column: string]: boolean } = {};
    pageIndex = 1;
    pageSize = 20;

    creating = false;
    busy = false;
    form = {title: '', description: '', priority: 'MEDIUM', repos: [] as string[], executor: null as string | null, model: '', qaReview: false};
    // null until the backend answers, so the "no executor" alert does not flash on load
    executors: { code: string, label: string, models: string[], icon: string | null }[] | null = null;

    private destroy$ = new Subject<void>();

    constructor(private api: AiDevService,
                private data: DataService,
                private scope: ScopeService,
                public i18n: I18NService,
                private settings: SettingsService,
                private title: TitleService,
                private msg: NzMessageService) {
    }

    ngOnInit(): void {
        try {
            if (localStorage.getItem(VIEW_KEY) === 'board') this.mode = 'board';
        } catch {
            // storage may be blocked: the table it is
        }
        this.title.setTitle(this.t('pool'));
        this.scope.ready().subscribe(() => this.api.projects().subscribe(res => {
            if (!this.ok(res)) return;
            this.projects = res.data || [];
            const picked = ScopeStore.value(AiDevService.scope, 'project');
            this.project = this.projects.find(p => String(p.id) === String(picked)) || null;
            if (!this.project && this.projects.length) {
                // writes go through the model's own API, which reads the project from the scope header
                this.switchProject(this.projects[0].id);
                return;
            }
            this.loading = false;
            if (this.project) this.load();
        }));
        timer(5000, 5000).pipe(takeUntil(this.destroy$)).subscribe(() => {
            if (this.rows.some(r => ACTIVE.includes(r.stage))) this.load();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    t(key: string): string {
        return this.i18n.fanyi('aidev.' + key);
    }

    switchProject(id: number): void {
        this.scope.pick(AiDevService.scope, {project: id}, AiDevService.page).subscribe();
    }

    load(): void {
        this.api.executors(this.project!.id).subscribe(res => {
            if (res && res.status === Status.SUCCESS) {
                this.executors = res.data.options || [];
            }
        });
        this.api.requirements(this.project!.id).subscribe(res => {
            if (this.ok(res)) this.rows = res.data || [];
        });
    }

    filtered(): DevRow[] {
        const k = this.keyword.trim().toLowerCase();
        return this.rows.filter(r => (this.filter === 'all' || (this.filter === 'mine' ? r.mine : r.toReview))
            && (!k || r.title.toLowerCase().includes(k) || r.code.toLowerCase().includes(k)));
    }

    count(filter: 'all' | 'mine' | 'review'): number {
        return this.rows.filter(r => filter === 'all' || (filter === 'mine' ? r.mine : r.toReview)).length;
    }

    // the status tab a requirement falls under
    private groupOf(r: DevRow): string {
        return GROUPS.find(g => g.stages.includes(r.stage))!.key;
    }

    tabCount(tab: string): number {
        const rows = this.filtered();
        return tab === 'all' ? rows.length : rows.filter(r => this.groupOf(r) === tab).length;
    }

    // what the table shows: the toolbar filters, then the tab, the most urgent first
    visible(): DevRow[] {
        const rows = this.filtered().filter(r => this.tab === 'all' || this.groupOf(r) === this.tab);
        const order = GROUPS.map(g => g.key);
        return rows.sort((a, b) => order.indexOf(this.groupOf(a)) - order.indexOf(this.groupOf(b))
            || PRIORITY.indexOf(a.priority) - PRIORITY.indexOf(b.priority)
            || b.updateTime.localeCompare(a.updateTime));
    }

    // the table follows the layout settings every erupt table page uses
    get bordered(): boolean {
        return !!this.settings.layout['bordered'];
    }

    get size(): 'small' | 'middle' | 'default' {
        return this.settings.layout['tableSize'] || 'small';
    }

    setMode(mode: 'table' | 'board'): void {
        this.mode = mode;
        try {
            localStorage.setItem(VIEW_KEY, mode);
        } catch {
            // not remembered then
        }
    }

    // the board: one column per status but cancelled, the toolbar filters applied, the most urgent first
    boardColumns(): { key: string, rows: DevRow[], shown: DevRow[] }[] {
        const rows = this.filtered();
        return GROUPS.filter(g => g.key !== 'cancelled').map(g => {
            const inColumn = rows.filter(r => g.stages.includes(r.stage)).sort((a, b) =>
                PRIORITY.indexOf(a.priority) - PRIORITY.indexOf(b.priority) || b.updateTime.localeCompare(a.updateTime));
            const finished = g.key === 'delivered';
            const sorted = finished ? [...inColumn].sort((a, b) => b.updateTime.localeCompare(a.updateTime)) : inColumn;
            return {key: g.key, rows: sorted, shown: this.expanded[g.key] ? sorted : sorted.slice(0, BOARD_LIMIT)};
        });
    }

    // not while agents work from it, nor once delivered; the server also checks it is the user's to delete
    deletable(r: DevRow): boolean {
        return !['QUEUED', 'RUNNING', 'VERIFYING', 'DELIVERED'].includes(r.stage);
    }

    remove(r: DevRow): void {
        this.data.deleteEruptData(AiDevService.erupt, r.id).subscribe(res => {
            if (!this.ok(res)) return;
            this.msg.success(this.t('deleted').replace('{0}', r.code));
            this.load();
        });
    }

    // where a repository's change went, or why it did not
    repoTitle(r: DevRow, alias: string): string {
        const d = r.deliveries?.[alias];
        if (!d) return alias + ' · ' + this.t('delivery.PENDING');
        return alias + ' · ' + this.t('delivery.' + d.status) + (d.status === 'PUSHED' ? ' → ' + d.branch : d.message ? ': ' + d.message : '');
    }

    priorityColor(p: string): string {
        return p === 'HIGH' ? 'red' : p === 'MEDIUM' ? 'orange' : 'default';
    }

    // the status column: one badge, with the progress when it runs
    badge(r: DevRow): { status: 'success' | 'processing' | 'default' | 'error' | 'warning', text: string } {
        switch (r.stage) {
            case 'RUNNING':
                return {status: 'processing', text: this.t('stage.RUNNING') + ' ' + (r.progress || 0) + '%'};
            case 'QUEUED':
            case 'VERIFYING':
                return {status: 'processing', text: this.t('stage.' + r.stage)};
            case 'REVIEW':
                return {status: 'warning', text: this.t('stage.REVIEW')};
            case 'ACCEPTANCE':
                return r.verdict && r.verdict.startsWith('FAIL')
                    ? {status: 'error', text: this.t('run.qa_failed')} : {status: 'warning', text: this.t('stage.ACCEPTANCE')};
            case 'FAILED':
                return {status: 'error', text: this.t('stage.FAILED')};
            case 'DELIVERED':
                return {status: 'success', text: this.t('stage.DELIVERED')};
            default:
                return {status: 'default', text: this.t('stage.' + r.stage)};
        }
    }

    // "just now", "5 min ago", "3 h ago", then the date
    ago(time: string): string {
        const m = Math.floor((Date.now() - new Date(time).getTime()) / 60000);
        if (m < 1) return this.t('ago.now');
        if (m < 60) return this.t('ago.minutes').replace('{0}', String(m));
        if (m < 24 * 60) return this.t('ago.hours').replace('{0}', String(Math.floor(m / 60)));
        const d = new Date(time);
        return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    setPriority(id: number, priority: string): void {
        this.data.execOperatorFun(AiDevService.erupt, 'priority', [id], {priority}).subscribe(res => {
            if (this.ok(res)) this.load();
        });
    }

    // the picked executor's models that match what is typed so far
    modelOptions(): string[] {
        const models = this.executors?.find(e => e.code === this.form.executor)?.models || [];
        const typed = (this.form.model || '').trim().toLowerCase();
        return (typed ? models.filter(m => m.toLowerCase().includes(typed)) : models).slice(0, 50);
    }

    // ------------------------------------------------------------------ new requirement

    openCreate(): void {
        this.form = {title: '', description: '', priority: 'MEDIUM', repos: [...(this.project?.repos || [])], executor: null, model: '', qaReview: false};
        this.creating = true;
        this.api.executors(this.project!.id).subscribe(res => {
            if (!this.ok(res)) return;
            this.executors = res.data.options || [];
            this.form.executor = res.data.preferred;
        });
    }

    create(): void {
        if (!this.form.title.trim() || !this.form.repos.length) {
            this.msg.warning(this.t('create_incomplete'));
            return;
        }
        this.busy = true;
        this.data.addEruptData(AiDevService.erupt, this.form).subscribe({
            next: res => {
                this.busy = false;
                if (!this.ok(res)) return;
                this.creating = false;
                this.load();
            },
            error: () => this.busy = false
        });
    }

    private ok(res: any): boolean {
        if (res && res.status === Status.SUCCESS) return true;
        this.loading = false;
        if (res && res.message) this.msg.error(res.message);
        return false;
    }

}
