import {Component, ElementRef, OnDestroy, OnInit, ViewChild, inject} from '@angular/core';
import {ClipboardService} from '@shared/service/clipboard.service';
import {TitleService} from '@delon/theme';
import {ActivatedRoute, Router} from '@angular/router';
import {NzMessageService} from 'ng-zorro-antd/message';
import {Subject, Subscription, timer} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {I18NService} from '@core';
import {DataService} from '@shared/service/data.service';
import {ScopeService, ScopeStore} from '@shared/service/scope.service';
import {Status} from '../../../erupt/model/erupt-api.model';
import {AiDevService, DevDetail, DevEvent, DevRepoDiff, DevReview, DevSession, Stage, DevWorkspace} from '../../ai-dev.service';
import {avatarTone, compact, duration, initial, PHASES, Step, stepOf, STEPS, stepState, StepState} from '../../ai-dev.util';

type Action = 'submit' | 'approve' | 'reject' | 'stop' | 'retry' | 'rework' | 'deliver' | 'cancel' | 'cleanup' | 'delete';

/** One tool call of the agent with what came back. */
interface ToolCall {
    name: string;
    input: string;
    result: string | null;
}

/** What the session log is drawn from: agent messages, and its tool calls folded into one block per run of them. */
type Block =
    | { kind: 'prompt', text: string }
    | { kind: 'text', text: string }
    | { kind: 'tools', calls: ToolCall[] }
    | { kind: 'status', icon: string, text: string }
    | { kind: 'result', ok: boolean, text: string }
    | { kind: 'error', text: string };

interface DiffLine {
    kind: 'file' | 'hunk' | 'add' | 'del' | 'ctx';
    text: string;
    // line numbers in the base and in the branch, where the line exists
    old?: number;
    new?: number;
}

// one row of the side-by-side view: a file or hunk header across both sides, or the base line beside the branch line
interface SplitRow {
    kind: 'file' | 'hunk' | 'pair';
    text?: string;
    left?: DiffLine;
    right?: DiffLine;
}

// one file of a repository's diff, in both layouts, with its line counts for the file list
interface FileDiff {
    path: string;
    lines: DiffLine[];
    rows: SplitRow[];
    add: number;
    del: number;
    collapsed: boolean;
}

type RepoDiffView = DevRepoDiff & { fileDiffs: FileDiff[], lineCount: number, expanded: boolean, active: number, filter: string };

const DIFF_LAYOUT_KEY = 'erupt-ai-dev.diff.layout';

const ACTIVE: Stage[] = ['QUEUED', 'RUNNING', 'VERIFYING'];

const POLL_MS = 3000;

@Component({
    standalone: false,
    selector: 'app-ai-dev-pool-detail',
    templateUrl: './pool-detail.component.html',
    styleUrls: ['../ai-dev.less', './pool-detail.component.less']
})
export class PoolDetailComponent implements OnInit, OnDestroy {

    private clipboard = inject(ClipboardService);

    readonly steps = STEPS;
    readonly phases = PHASES;
    readonly avatarTone = avatarTone;
    readonly initial = initial;
    readonly duration = duration;
    readonly compact = compact;

    id!: number;
    detail: DevDetail | null = null;
    view: Step = 'define';

    session: DevSession | null = null;
    events: DevEvent[] = [];
    blocks: Block[] = [];
    // tool blocks and the prompt are folded until opened
    open: { [index: number]: boolean } = {};
    private lastSeq = 0;
    private eventsSub: Subscription | null = null;

    diffs: RepoDiffView[] | null = null;

    diffLayout: 'unified' | 'split' = 'unified';
    message = '';
    busy = false;

    editing = false;


    // approve or reject waiting for the reviewer's comment, required to reject
    reviewing: 'approve' | 'reject' | null = null;
    reviewComment = '';
    draft = {title: '', description: ''};

    private destroy$ = new Subject<void>();

    @ViewChild('feed') private feed?: ElementRef<HTMLElement>;

    // the newest session id seen so far, and whether the view jumps to a newer one when it appears
    private latestSeen = 0;

    workspaces: DevWorkspace[] = [];
    private followLatest = true;

    // the feed follows new messages unless the reader scrolled up to read
    private stick = true;

    constructor(private route: ActivatedRoute,
                private title: TitleService,
                private router: Router,
                private api: AiDevService,
                private data: DataService,
                private scope: ScopeService,
                private i18n: I18NService,
                private msg: NzMessageService) {
    }

    ngOnInit(): void {
        try {
            if (localStorage.getItem(DIFF_LAYOUT_KEY) === 'split') this.diffLayout = 'split';
        } catch {
            // storage may be blocked: unified it is
        }
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.id = Number(params.get('id'));
            this.detail = null;
            this.session = null;
            this.diffs = null;
            this.scope.ready().subscribe(() => this.load(true));
        });
        timer(POLL_MS, POLL_MS).pipe(takeUntil(this.destroy$)).subscribe(() => {
            if (this.detail && ACTIVE.includes(this.detail.requirement.stage)) this.load(false);
            if (this.session?.status === 'RUNNING') this.loadEvents();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    t(key: string): string {
        return this.i18n.fanyi('aidev.' + key);
    }

    back(): void {
        this.router.navigate([AiDevService.page]);
    }

    // ------------------------------------------------------------------ loading

    private load(first: boolean): void {
        this.api.requirement(this.id).subscribe(res => {
            if (!this.ok(res, !first)) return;
            const detail: DevDetail = res.data;
            // the row operations check the requirement against the page-header scope: keep them in step
            if (first && String(ScopeStore.value(AiDevService.scope, 'project')) !== String(detail.projectId)) {
                this.scope.pick(AiDevService.scope, {project: detail.projectId}, this.router.url).subscribe();
                return;
            }
            const stageChanged = this.detail?.requirement.stage !== detail.requirement.stage;
            this.detail = detail;
            if (first) this.title.setTitle(detail.requirement.code + ' · ' + detail.requirement.title);
            if (first || stageChanged) this.view = stepOf(detail.requirement.stage);
            // git is read for the workspace only when something could have changed it
            if (first || stageChanged) this.loadWorkspace();
            const current = detail.sessions.find(s => s.id === this.session?.id);
            const newest = detail.sessions[0];
            if (current && newest && newest.id > this.latestSeen && this.followLatest) {
                // a new run started (a retry, a change request, the QA run): follow it
                this.openSession(newest);
            } else if (current) {
                this.session = current;
            } else if (detail.sessions.length) {
                // a running session first, else the developer's latest: that is where the work is
                this.openSession(detail.sessions.find(s => s.status === 'RUNNING')
                    || detail.sessions.find(s => s.role === 'DEVELOPER') || detail.sessions[0]);
            }
            if (newest) this.latestSeen = Math.max(this.latestSeen, newest.id);
            if (this.view === 'deliver' && !this.diffs) this.loadDiff();
        });
    }

    loadWorkspace(): void {
        this.api.workspace(this.id).subscribe(res => {
            if (res && res.status === Status.SUCCESS) this.workspaces = res.data || [];
        });
    }

    remove(): void {
        if (!this.detail || this.busy) return;
        this.busy = true;
        this.data.deleteEruptData(AiDevService.erupt, this.detail.requirement.id).subscribe({
            next: res => {
                this.busy = false;
                if (!this.ok(res)) return;
                this.msg.success(this.t('deleted').replace('{0}', this.detail!.requirement.code));
                this.back();
            },
            error: () => this.busy = false
        });
    }

    // picked in the session selector: following the newest run stops while an older one is read
    pickSession(id: number): void {
        const session = this.sessionById(id);
        if (!session) return;
        this.followLatest = session.id === this.detail?.sessions[0]?.id;
        this.openSession(session);
    }

    openSession(session: DevSession): void {
        this.stick = true;
        this.session = session;
        this.events = [];
        this.blocks = [];
        this.open = {};
        this.lastSeq = 0;
        this.loadEvents();
    }

    sessionById(id: number): DevSession | undefined {
        return this.detail?.sessions.find(s => s.id === id);
    }

    // sessions are numbered oldest first, the list comes newest first
    sessionNo(s: DevSession): number {
        return this.detail!.sessions.length - this.detail!.sessions.indexOf(s);
    }

    private loadEvents(): void {
        const session = this.session;
        if (!session || this.eventsSub) return;
        this.eventsSub = this.api.events(session.id, this.lastSeq).subscribe({
            next: (res: any) => {
                const log = res?.data || res;
                if (session.id !== this.session?.id || !log?.events) return;
                if (log.events.length) {
                    this.events.push(...log.events);
                    this.lastSeq = log.events[log.events.length - 1].seq;
                    this.blocks = this.toBlocks(this.events);
                    if (this.stick) setTimeout(() => this.scrollToEnd());
                }
                this.session.status = log.status;
            },
            complete: () => this.eventsSub = null,
            error: () => this.eventsSub = null
        });
    }

    private toBlocks(events: DevEvent[]): Block[] {
        const blocks: Block[] = [];
        for (const e of events) {
            const last = blocks[blocks.length - 1];
            switch (e.kind) {
                case 'TOOL':
                    if (last?.kind === 'tools') last.calls.push({name: e.name || '', input: this.toolInput(e.content), result: null});
                    else blocks.push({kind: 'tools', calls: [{name: e.name || '', input: this.toolInput(e.content), result: null}]});
                    break;
                case 'TOOL_RESULT':
                    if (last?.kind === 'tools') {
                        const call = [...last.calls].reverse().find(c => c.result === null);
                        if (call) call.result = e.content || '';
                    }
                    break;
                case 'TEXT':
                    if (e.content?.trim()) blocks.push({kind: 'text', text: e.content});
                    break;
                case 'RESULT':
                    blocks.push({kind: 'result', ok: e.name === 'success', text: e.content || ''});
                    break;
                case 'ERROR':
                    // erupt's closing line after a failed answer only repeats it
                    if (!(last?.kind === 'result' && !last.ok)) blocks.push({kind: 'error', text: e.content || ''});
                    break;
                default:
                    if (e.name === 'prompt') blocks.push({kind: 'prompt', text: e.content || ''});
                    else if (e.name === 'report_progress') blocks.push({kind: 'status', icon: 'fa-tasks', text: this.progressLine(e.content || '')});
                    else if (e.name === 'report_verdict') blocks.push({kind: 'status', icon: 'fa-check-square-o', text: e.content || ''});
                    else if (e.name !== 'init' && e.content) blocks.push({kind: 'status', icon: 'fa-cog', text: e.content});
            }
        }
        return blocks;
    }

    // "55% implement - halfway" becomes "Progress 55% · <translated phase> · halfway"
    private progressLine(content: string): string {
        const m = /^(\d+)% (\S+)(?: - (.*))?$/.exec(content);
        if (!m) return content;
        const key = 'aidev.phase.' + m[2], label = this.i18n.fanyi(key);
        return [this.t('progress_report') + ' ' + m[1] + '%', label === key ? m[2] : label, m[3]].filter(x => !!x).join(' · ');
    }

    // a Bash call shows its command, a file tool its path, anything else its input as is
    private toolInput(content: string | null): string {
        if (!content) return '';
        try {
            const input = JSON.parse(content);
            return input.command || input.file_path || input.pattern || input.path || content;
        } catch {
            return content;
        }
    }

    onFeedScroll(el: HTMLElement): void {
        this.stick = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    }

    private scrollToEnd(): void {
        const el = this.feed?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
    }

    toggle(i: number): void {
        this.open[i] = !this.open[i];
    }

    // ------------------------------------------------------------------ diff

    loadDiff(): void {
        this.api.diff(this.id).subscribe(res => {
            if (!this.ok(res)) return;
            const diffs: RepoDiffView[] = (res.data as DevRepoDiff[]).map(d => {
                const fileDiffs = PoolDetailComponent.byFile(PoolDetailComponent.parseDiff(d.patch));
                return {...d, fileDiffs, lineCount: fileDiffs.reduce((a, f) => a + f.lines.length, 0), expanded: false, active: 0, filter: ''};
            });
            // small changes open right away: nothing to click through for a few lines
            const total = diffs.reduce((a, d) => a + d.lineCount, 0);
            if (total <= 400) diffs.forEach(d => d.expanded = d.lineCount > 0);
            this.diffs = diffs;
        });
    }

    // a repository delivered onto its target branch no longer differs from it: say where the change went
    mergedInto(alias: string): string | null {
        const d = this.detail?.deliveries.find(x => x.repoAlias === alias && x.status === 'PUSHED');
        return d && !d.branch.startsWith('req/') ? d.branch : null;
    }

    static parseDiff(patch: string): DiffLine[] {
        if (!patch) return [];
        let oldNo = 0, newNo = 0;
        return patch.split('\n').map((text): DiffLine | null => {
            if (text.startsWith('diff --git')) return {kind: 'file', text: text.replace(/^diff --git a\/(\S+) b\/\S+$/, '$1')};
            if (text.startsWith('@@')) {
                const m = /^@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(text);
                if (m) [oldNo, newNo] = [+m[1], +m[2]];
                return {kind: 'hunk', text};
            }
            if (text.startsWith('+++') || text.startsWith('---') || text.startsWith('index ')) return null;
            if (text.startsWith('+')) return {kind: 'add', text: text.slice(1), new: newNo++};
            if (text.startsWith('-')) return {kind: 'del', text: text.slice(1), old: oldNo++};
            // "\ No newline at end of file" and other notes carry no line of their own
            if (text.startsWith('\\')) return {kind: 'ctx', text};
            return {kind: 'ctx', text: text.startsWith(' ') ? text.slice(1) : text, old: oldNo++, new: newNo++};
        }).filter((l): l is DiffLine => !!l);
    }

    // the patch cut at each file header; the header itself is drawn by the page
    static byFile(lines: DiffLine[]): FileDiff[] {
        const files: FileDiff[] = [];
        for (const l of lines) {
            if (l.kind === 'file') {
                files.push({path: l.text, lines: [], rows: [], add: 0, del: 0, collapsed: false});
                continue;
            }
            if (!files.length) continue;
            const f = files[files.length - 1];
            f.lines.push(l);
            if (l.kind === 'add') f.add++;
            if (l.kind === 'del') f.del++;
        }
        files.forEach(f => f.rows = PoolDetailComponent.splitRows(f.lines));
        return files;
    }

    shownFiles(d: RepoDiffView): { f: FileDiff, i: number }[] {
        const q = d.filter.trim().toLowerCase();
        return d.fileDiffs.map((f, i) => ({f, i})).filter(it => !q || it.f.path.toLowerCase().includes(q));
    }

    fileName(path: string): string {
        return path.substring(path.lastIndexOf('/') + 1);
    }

    fileDir(path: string): string {
        const i = path.lastIndexOf('/');
        return i < 0 ? '' : path.substring(0, i);
    }

    // brings a file's header to the top of the repository's diff, opening it if it was folded
    jumpTo(d: RepoDiffView, i: number, box: HTMLElement): void {
        d.fileDiffs[i].collapsed = false;
        d.active = i;
        setTimeout(() => {
            const head = box.querySelector<HTMLElement>('[data-file="' + i + '"]');
            if (head) box.scrollTo({top: head.offsetTop, behavior: 'smooth'});
        });
    }

    // the file list follows the diff: the last header scrolled past is the file being read
    spy(d: RepoDiffView, box: HTMLElement): void {
        let active = 0;
        box.querySelectorAll<HTMLElement>('[data-file]').forEach(head => {
            if (head.offsetTop <= box.scrollTop + 8) active = +head.dataset['file']!;
        });
        d.active = active;
    }

    // removed lines sit beside the added lines that replace them, in order; context lines on both sides
    static splitRows(lines: DiffLine[]): SplitRow[] {
        const rows: SplitRow[] = [];
        let dels: DiffLine[] = [], adds: DiffLine[] = [];
        const flush = () => {
            for (let i = 0; i < Math.max(dels.length, adds.length); i++) rows.push({kind: 'pair', left: dels[i], right: adds[i]});
            dels = [];
            adds = [];
        };
        for (const l of lines) {
            if (l.kind === 'del') {
                if (adds.length) flush();
                dels.push(l);
            } else if (l.kind === 'add') {
                adds.push(l);
            } else {
                flush();
                rows.push(l.kind === 'ctx' ? {kind: 'pair', left: l, right: l} : {kind: l.kind, text: l.text});
            }
        }
        flush();
        return rows;
    }

    setDiffLayout(layout: 'unified' | 'split'): void {
        this.diffLayout = layout;
        try {
            localStorage.setItem(DIFF_LAYOUT_KEY, layout);
        } catch {
            // not remembered then
        }
    }

    // ------------------------------------------------------------------ steps & progress

    stepState(step: Step): StepState {
        return stepState(this.detail!.requirement.stage, step);
    }

    setView(step: Step): void {
        this.view = step;
        if (step === 'deliver' && !this.diffs) this.loadDiff();
    }

    phaseState(p: { from: number, to: number }): 'done' | 'current' | 'todo' {
        const r = this.detail!.requirement;
        if (r.stage === 'DELIVERED') return 'done';
        if (r.stage === 'ACCEPTANCE') return p.to < 100 ? 'done' : 'current';
        const v = r.progress || 0;
        if (v >= p.to) return 'done';
        return v >= p.from && ACTIVE.includes(r.stage) ? 'current' : 'todo';
    }

    currentPhase(): string {
        const p = this.phases.find(x => this.phaseState(x) === 'current');
        return p ? this.t('phase.' + p.key) : '';
    }

    // whether the requirement got as far as this step
    reached(step: Step): boolean {
        return this.stepState(step) !== 'todo' || this.detail!.deliveries.length > 0;
    }

    setPriority(id: number, priority: string): void {
        this.data.execOperatorFun(AiDevService.erupt, 'priority', [id], {priority}).subscribe(res => {
            if (this.ok(res)) this.load(false);
        });
    }

    priorityColor(p: string): string {
        return p === 'HIGH' ? 'red' : p === 'MEDIUM' ? 'orange' : 'default';
    }

    // nz-tag color of a stage
    stageColor(stage: Stage): string {
        switch (stage) {
            case 'REVIEW':
                return 'warning';
            case 'QUEUED':
            case 'RUNNING':
            case 'VERIFYING':
                return 'processing';
            case 'ACCEPTANCE':
                return 'cyan';
            case 'DELIVERED':
                return 'success';
            case 'FAILED':
                return 'error';
            default:
                return 'default';
        }
    }

    sessionColor(s: DevSession): string {
        return s.status === 'RUNNING' ? 'processing' : s.status === 'SUCCEEDED' ? 'success' : s.status === 'STOPPED' ? 'default' : 'error';
    }

    // nz-steps (navigation): the viewed step is the current one, each step shows how far the requirement got
    // whether the agents are working on this step right now
    working(step: Step): boolean {
        return step === 'run' && ['QUEUED', 'RUNNING', 'VERIFYING'].includes(this.detail!.requirement.stage);
    }

    // one line under each step: what happened there, or what it waits for
    stepHint(step: Step): string {
        const d = this.detail!, r = d.requirement, state = this.stepState(step);
        switch (step) {
            case 'define':
                return r.createBy || '';
            case 'review':
                if (state === 'done') return this.t('hint.approved').replace('{0}', r.reviewer || '');
                if (state === 'current') return this.t('hint.waiting').replace('{0}', r.reviewer || this.t('reviewer'));
                return r.stage === 'CANCELLED' ? this.t('stage.CANCELLED') : this.t('hint.not_submitted');
            case 'run':
                if (r.stage === 'RUNNING') return (r.progress || 0) + '%' + (r.phase ? ' · ' + this.t('phase.' + r.phase) : '');
                if (state === 'todo') return this.t('run.not_started');
                if (state === 'current' || state === 'failed') return this.t('stage.' + r.stage);
                return this.t('hint.sessions').replace('{0}', String(d.sessions.length));
            default:
                if (r.stage === 'DELIVERED') return this.t('hint.pushed').replace('{0}', String(d.deliveries.filter(x => x.status === 'PUSHED').length));
                if (r.stage === 'ACCEPTANCE') return r.verdict && r.verdict.startsWith('FAIL') ? this.t('run.qa_failed') : this.t('stage.ACCEPTANCE');
                return '—';
        }
    }

    /**
     * Activity of the last 24 hours, one cell per hour, oldest first: how many agent sessions and
     * deliveries touched each hour (0, 1, 2+).
     */
    activity(): number[] {
        const now = Date.now(), hour = 3600_000;
        const cells = new Array(24).fill(0);
        const mark = (from: string | null, to: string | null) => {
            if (!from) return;
            const start = new Date(from).getTime(), end = to ? new Date(to).getTime() : now;
            for (let t = start; t <= end; t += hour) {
                const i = 23 - Math.floor((now - t) / hour);
                if (i >= 0 && i < 24) cells[i]++;
            }
        };
        this.detail!.sessions.forEach(s => mark(s.startedAt, s.endedAt));
        this.detail!.deliveries.forEach(d => mark(d.deliveredAt, d.deliveredAt));
        mark(this.detail!.requirement.updateTime, this.detail!.requirement.updateTime);
        return cells.map(c => Math.min(2, c));
    }

    totalTokens(): number {
        return this.detail!.sessions.reduce((a, s) => a + (s.tokens || 0), 0);
    }

    // what the CLIs reported, summed over every run; null when none reported a cost
    totalCost(): number | null {
        const costs = this.detail!.sessions.map(s => Number(s.costUsd)).filter(c => Number.isFinite(c) && c > 0);
        return costs.length ? costs.reduce((a, c) => a + c, 0) : null;
    }

    // $0.42, $0.0031 for a few tokens' worth; — when unknown
    money(value: number | null | undefined): string {
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) return '—';
        return '$' + (n < 0.01 ? n.toFixed(4) : n.toFixed(2));
    }

    // ------------------------------------------------------------------ actions

    can(action: Action): boolean {
        if (!this.detail) return false;
        const stage = this.detail.requirement.stage;
        const review = this.detail.canReview;
        switch (action) {
            case 'submit':
                return stage === 'DRAFT';
            case 'approve':
            case 'reject':
                return stage === 'REVIEW' && this.detail.canApprove;
            case 'stop':
                return stage === 'RUNNING' || stage === 'VERIFYING';
            case 'retry':
                return stage === 'FAILED';
            case 'rework':
            case 'deliver':
                return stage === 'ACCEPTANCE' && review;
            case 'cancel':
                return !['DELIVERED', 'CANCELLED', 'RUNNING', 'VERIFYING'].includes(stage);
            case 'delete':
                return !['QUEUED', 'RUNNING', 'VERIFYING', 'DELIVERED'].includes(stage);
            case 'cleanup':
                return ['DRAFT', 'REVIEW', 'FAILED', 'CANCELLED'].includes(stage) && this.workspaces.some(w => w.exists);
        }
    }

    act(action: Action, param: object | null = null): void {
        if (!this.detail || this.busy) return;
        this.busy = true;
        this.data.execOperatorFun(AiDevService.erupt, action, [this.detail.requirement.id], param).subscribe({
            next: res => {
                this.busy = false;
                if (!this.ok(res)) return;
                this.message = '';
                this.diffs = null;
                // the run this action starts is the one to watch
                this.followLatest = true;
                if (action === 'cleanup' || action === 'cancel') this.loadWorkspace();
                if (['retry', 'rework', 'approve'].includes(action)) this.view = 'run';
                this.load(false);
            },
            error: () => this.busy = false
        });
    }

    review(action: 'approve' | 'reject'): void {
        this.reviewComment = '';
        this.reviewing = action;
    }

    confirmReview(): void {
        const action = this.reviewing;
        if (!action || (action === 'reject' && !this.reviewComment.trim())) return;
        this.reviewing = null;
        this.act(action, {comment: this.reviewComment.trim()});
    }

    // the reason it came back to draft, while nothing newer happened to it
    rejection(): DevReview | null {
        const last = this.detail?.reviews[0];
        return last && last.decision === 'REJECTED' && this.detail!.requirement.stage === 'DRAFT' ? last : null;
    }

    // a follow-up continues the agent's session: a retry after a failure, requested changes after a run
    composerAction(): Action | null {
        if (this.can('retry')) return 'retry';
        if (this.can('rework')) return 'rework';
        return null;
    }

    composerHint(): string {
        const stage = this.detail?.requirement.stage;
        if (this.composerAction()) return this.t('composer.' + this.composerAction());
        if (stage === 'RUNNING' || stage === 'VERIFYING' || stage === 'QUEUED') return this.t('composer.running');
        return this.t('composer.closed');
    }

    send(): void {
        const action = this.composerAction();
        if (!action || (action === 'rework' && !this.message.trim())) return;
        this.act(action, {instruction: this.message});
    }

    onKey(e: KeyboardEvent): void {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            this.send();
        }
    }

    // the definition is frozen while an agent works from it and once delivered, as the server enforces
    editable(): boolean {
        return !!this.detail && !['QUEUED', 'RUNNING', 'VERIFYING', 'DELIVERED'].includes(this.detail.requirement.stage);
    }

    startEdit(): void {
        this.draft = {title: this.detail!.requirement.title, description: this.detail!.description || ''};
        this.editing = true;
    }

    // through the model's own update, so its validation and data proxy still apply
    saveEdit(): void {
        if (!this.draft.title.trim()) return;
        this.busy = true;
        this.data.queryEruptDataById(AiDevService.erupt, this.id).subscribe({
            next: row => {
                this.data.updateEruptData(AiDevService.erupt, {...row, title: this.draft.title.trim(), description: this.draft.description}).subscribe({
                    next: res => {
                        this.busy = false;
                        if (!this.ok(res)) return;
                        this.editing = false;
                        this.load(false);
                    },
                    error: () => this.busy = false
                });
            },
            error: () => this.busy = false
        });
    }

    copyDescription(): void {
        this.clipboard.copy(this.detail?.description || '', this.t('copied'));
    }

    private ok(res: any, silent = false): boolean {
        if (res && res.status === Status.SUCCESS) return true;
        if (!silent && res && res.message) this.msg.error(res.message);
        return false;
    }

}
