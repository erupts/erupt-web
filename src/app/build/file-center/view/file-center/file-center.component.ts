import {Component, HostListener, OnInit} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzResizeEvent} from 'ng-zorro-antd/resizable';
import {I18NService} from '@core';
import {Status} from '../../../erupt/model/erupt-api.model';
import {FileCenterService, FileEntry} from '../../file-center.service';

/** One Finder column: a directory and what it holds. */
interface Column {
    path: string;
    entries: FileEntry[];
    selected: FileEntry | null;
    loading: boolean;
    width: number;
    dropping: boolean;
}

/** What the right pane shows for the selected file. */
interface Preview {
    entry: FileEntry;
    url: string;
    link: string | null;
    kind: 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'none';
    text: string | null;
    textTooLarge: boolean;
}

/** An inline name editor: a new folder at the top of a column, or a row being renamed. */
interface Editing {
    kind: 'mkdir' | 'rename';
    depth: number;
    path: string | null;
    value: string;
}

const COLUMN_WIDTH_KEY = 'erupt-file-center-column-width';
const PREVIEW_WIDTH_KEY = 'erupt-file-center-preview-width';

@Component({
    standalone: false,
    selector: 'app-file-center',
    templateUrl: './file-center.component.html',
    styleUrls: ['./file-center.component.less']
})
export class FileCenterComponent implements OnInit {

    stores: string[] = [];
    store: string | null = null;
    writable = false;
    textPreviewBytes = 256 * 1024;
    columns: Column[] = [];
    preview: Preview | null = null;
    editing: Editing | null = null;
    filter = '';
    columnWidth = Number(localStorage.getItem(COLUMN_WIDTH_KEY)) || 240;
    previewWidth = Number(localStorage.getItem(PREVIEW_WIDTH_KEY)) || 320;
    // listings and previews answer out of order when the user clicks fast: only the latest counts
    private previewSeq = 0;

    constructor(private api: FileCenterService,
                private msg: NzMessageService,
                public i18n: I18NService) {
    }

    ngOnInit(): void {
        this.api.info().subscribe(res => {
            if (!this.ok(res)) return;
            this.stores = res.data.stores || [];
            this.writable = !!res.data.writable;
            this.textPreviewBytes = res.data.textPreviewBytes || this.textPreviewBytes;
            if (this.stores.length) this.openStore(this.stores[0]);
        });
    }

    // ---- state helpers

    private ok(res: any): boolean {
        if (res && res.status === Status.SUCCESS) return true;
        if (res && res.message) this.msg.error(res.message);
        return false;
    }

    t(key: string): string {
        return this.i18n.fanyi('file.' + key);
    }

    /** The deepest selected entry, if any. */
    selected(): FileEntry | null {
        for (let i = this.columns.length - 1; i >= 0; i--) {
            if (this.columns[i].selected) return this.columns[i].selected;
        }
        return null;
    }

    /** Where an upload or a new folder lands: the selected folder, else the last column. */
    currentDir(): string {
        const sel = this.selected();
        if (sel && sel.dir) return sel.path;
        return this.columns.length ? this.columns[this.columns.length - 1].path : '/';
    }

    private depthOf(dir: string): number {
        return this.columns.findIndex(c => c.path === dir);
    }

    private parentOf(path: string): string {
        const slash = path.lastIndexOf('/');
        return slash <= 0 ? '/' : path.substring(0, slash);
    }

    /** The rows a column shows: the last column honours the search box. */
    shown(col: Column, depth: number): FileEntry[] {
        if (depth !== this.columns.length - 1 || !this.filter) return col.entries;
        const needle = this.filter.toLowerCase();
        return col.entries.filter(e => e.name.toLowerCase().includes(needle));
    }

    crumbs(): { name: string, path: string }[] {
        const dir = this.currentDir();
        const parts = dir === '/' ? [] : dir.substring(1).split('/');
        const crumbs = [{name: this.store || '', path: '/'}];
        let acc = '';
        for (const part of parts) {
            acc += '/' + part;
            crumbs.push({name: part, path: acc});
        }
        return crumbs;
    }

    // ---- navigation

    openStore(store: string): void {
        this.store = store;
        this.columns = [];
        this.preview = null;
        this.editing = null;
        this.filter = '';
        this.open('/', 0);
    }

    /** Opens a directory as the column at `depth`, dropping everything to its right. */
    open(path: string, depth: number): void {
        const col: Column = {path, entries: [], selected: null, loading: true, width: this.columnWidth, dropping: false};
        this.columns = [...this.columns.slice(0, depth), col];
        this.editing = null;
        this.api.list(this.store!, path).subscribe({
            next: res => {
                col.loading = false;
                if (this.ok(res)) col.entries = res.data || [];
                this.scrollToEnd();
            },
            error: () => col.loading = false
        });
    }

    select(depth: number, entry: FileEntry): void {
        if (this.editing) return;
        this.columns = this.columns.slice(0, depth + 1);
        this.columns[depth].selected = entry;
        if (entry.dir) {
            this.preview = null;
            this.open(entry.path, depth + 1);
        } else {
            this.showPreview(entry);
        }
    }

    openCrumb(path: string): void {
        const depth = path === '/' ? 0 : path.split('/').length - 1;
        this.columns = this.columns.slice(0, depth);
        if (depth > 0) this.columns[depth - 1].selected = this.columns[depth - 1].entries.find(e => e.path === path) || null;
        this.preview = null;
        this.open(path, depth);
    }

    /** Reads a directory again, keeping its selection when the entry is still there. */
    private reload(dir: string): void {
        const depth = this.depthOf(dir);
        if (depth < 0) {
            this.open(dir, this.columns.length);
            return;
        }
        const col = this.columns[depth];
        col.loading = true;
        this.api.list(this.store!, dir).subscribe({
            next: res => {
                col.loading = false;
                if (!this.ok(res)) return;
                col.entries = res.data || [];
                const kept = col.selected ? col.entries.find(e => e.path === col.selected!.path) || null : null;
                col.selected = kept;
                // the columns to the right belong to the old selection
                this.columns = this.columns.slice(0, kept && kept.dir ? depth + 2 : depth + 1);
                if (!kept) this.preview = null;
            },
            error: () => col.loading = false
        });
    }

    private scrollToEnd(): void {
        setTimeout(() => {
            const el = document.querySelector('.fc-columns');
            if (el) el.scrollLeft = el.scrollWidth;
        });
    }

    // ---- preview

    kindOf(entry: FileEntry): Preview['kind'] {
        const t = entry.contentType || '';
        if (/^image\//.test(t)) return 'image';
        if (/^video\//.test(t)) return 'video';
        if (/^audio\//.test(t)) return 'audio';
        if (/pdf/.test(t)) return 'pdf';
        if (/^text\/|json|xml|javascript|yaml|csv|sql/.test(t) || /\.(md|log|yml|yaml|properties|conf|ini|sh|sql|ts|java|py|go|rs|toml|env)$/i.test(entry.name)) return 'text';
        return 'none';
    }

    /** The Font Awesome icon of a row, by what the file is. */
    icon(entry: FileEntry, open: boolean = false): string {
        if (entry.dir) return open ? 'fa-folder-open' : 'fa-folder';
        const t = entry.contentType || '';
        const ext = (entry.name.split('.').pop() || '').toLowerCase();
        if (/^image\//.test(t) || /^(png|jpe?g|gif|svg|webp|bmp|ico|heic)$/.test(ext)) return 'fa-file-image-o';
        if (/^video\//.test(t) || /^(mp4|mov|mkv|webm|avi)$/.test(ext)) return 'fa-file-video-o';
        if (/^audio\//.test(t) || /^(mp3|wav|flac|aac|ogg|m4a)$/.test(ext)) return 'fa-file-audio-o';
        if (/pdf/.test(t) || ext === 'pdf') return 'fa-file-pdf-o';
        if (/^(doc|docx|odt|rtf)$/.test(ext)) return 'fa-file-word-o';
        if (/^(xls|xlsx|csv|ods|tsv)$/.test(ext)) return 'fa-file-excel-o';
        if (/^(ppt|pptx|odp|key)$/.test(ext)) return 'fa-file-powerpoint-o';
        if (/^(zip|rar|7z|gz|tgz|tar|bz2|xz|jar|war)$/.test(ext) || /zip|compressed|tar/.test(t)) return 'fa-file-archive-o';
        if (/^(js|ts|java|py|go|rs|rb|php|c|cpp|h|cs|kt|swift|sql|sh|json|xml|yml|yaml|toml|html|css|less|scss|vue)$/.test(ext)) return 'fa-file-code-o';
        if (/^text\//.test(t) || /^(txt|md|log|properties|conf|ini|env)$/.test(ext)) return 'fa-file-text-o';
        return 'fa-file-o';
    }

    iconClass(entry: FileEntry, open: boolean = false): string {
        const icon = this.icon(entry, open);
        return icon + ' ' + icon.replace('fa-file-', 'kind-').replace('-o', '').replace('fa-folder-open', 'kind-folder').replace('fa-folder', 'kind-folder');
    }

    private showPreview(entry: FileEntry): void {
        const seq = ++this.previewSeq;
        const kind = this.kindOf(entry);
        const preview: Preview = {entry, url: this.api.rawUrl(this.store!, entry.path), link: null, kind, text: null, textTooLarge: false};
        this.preview = preview;
        this.api.stat(this.store!, entry.path).subscribe(res => {
            if (seq !== this.previewSeq || !this.ok(res)) return;
            preview.link = res.data.url && res.data.url !== 'null' ? res.data.url : null;
            if (res.data.entry) preview.entry = res.data.entry;
        });
        if (kind === 'text') {
            if (entry.size > this.textPreviewBytes) {
                preview.textTooLarge = true;
            } else {
                this.api.text(this.store!, entry.path).subscribe(text => {
                    if (seq === this.previewSeq) preview.text = text;
                });
            }
        }
    }

    openRaw(): void {
        if (this.preview) window.open(this.preview.url);
    }

    download(): void {
        if (this.preview) location.href = this.api.rawUrl(this.store!, this.preview.entry.path, true);
    }

    copyLink(): void {
        if (!this.preview?.link) return;
        navigator.clipboard.writeText(new URL(this.preview.link, location.href).href).then(() => this.msg.success(this.t('link_copied')));
    }

    size(n: number): string {
        if (n < 1024) return n + ' B';
        if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
        if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
        return (n / 1073741824).toFixed(2) + ' GB';
    }

    // ---- changes

    pick(input: HTMLInputElement): void {
        if (!this.writable) return;
        input.value = '';
        input.click();
    }

    upload(dir: string, files: FileList | File[] | null): void {
        if (!this.writable || !files || !files.length) return;
        const list = Array.from(files);
        const depth = this.depthOf(dir);
        if (depth >= 0) this.columns[depth].loading = true;
        this.api.upload(this.store!, dir, list).subscribe({
            next: res => {
                if (this.ok(res)) this.msg.success(this.t('upload') + ' · ' + list.length);
                this.reload(dir);
            },
            error: () => this.reload(dir)
        });
    }

    onDrop(event: DragEvent, col: Column): void {
        event.preventDefault();
        col.dropping = false;
        if (event.dataTransfer) this.upload(col.path, event.dataTransfer.files);
    }

    onDragOver(event: DragEvent, col: Column): void {
        if (!this.writable) return;
        event.preventDefault();
        col.dropping = true;
    }

    startMkdir(): void {
        if (!this.writable) return;
        const dir = this.currentDir();
        let depth = this.depthOf(dir);
        if (depth < 0) return;
        this.editing = {kind: 'mkdir', depth, path: null, value: ''};
        this.focusEditor();
    }

    startRename(): void {
        const entry = this.selected();
        if (!this.writable || !entry) return;
        const depth = this.depthOf(this.parentOf(entry.path));
        if (depth < 0) return;
        this.editing = {kind: 'rename', depth, path: entry.path, value: entry.name};
        this.focusEditor();
    }

    private focusEditor(): void {
        setTimeout(() => {
            const input = document.querySelector<HTMLInputElement>('.fc-edit-input');
            if (input) {
                input.focus();
                input.select();
            }
        });
    }

    commitEdit(): void {
        const editing = this.editing;
        if (!editing) return;
        const name = editing.value.trim();
        const col = this.columns[editing.depth];
        if (!name || !col) {
            this.editing = null;
            return;
        }
        this.editing = null;
        if (editing.kind === 'mkdir') {
            this.api.mkdir(this.store!, col.path, name).subscribe(res => {
                if (this.ok(res)) this.reload(col.path);
            });
        } else if (editing.path && name !== this.selectedName(editing)) {
            this.api.rename(this.store!, editing.path, name).subscribe(res => {
                if (!this.ok(res)) return;
                const renamed = this.parentOf(editing.path!) + (this.parentOf(editing.path!) === '/' ? '' : '/') + name;
                // the renamed entry stays selected; its sub columns are reopened under the new path
                col.selected = {...col.selected!, name, path: renamed};
                this.columns = this.columns.slice(0, editing.depth + 1);
                this.preview = null;
                this.reload(col.path);
            });
        }
    }

    private selectedName(editing: Editing): string {
        const col = this.columns[editing.depth];
        return col?.selected?.name || '';
    }

    cancelEdit(): void {
        this.editing = null;
    }

    remove(): void {
        const entry = this.selected();
        if (!this.writable || !entry) return;
        const dir = this.parentOf(entry.path);
        this.api.delete(this.store!, [entry.path]).subscribe(res => {
            if (!this.ok(res)) return;
            const depth = this.depthOf(dir);
            if (depth >= 0) {
                this.columns[depth].selected = null;
                this.columns = this.columns.slice(0, depth + 1);
            }
            this.preview = null;
            this.reload(dir);
        });
    }

    // ---- layout

    onColumnResize({width}: NzResizeEvent, col: Column): void {
        if (!width) return;
        col.width = width;
        this.columnWidth = width;
        localStorage.setItem(COLUMN_WIDTH_KEY, String(width));
    }

    onPreviewResize({width}: NzResizeEvent): void {
        if (!width) return;
        this.previewWidth = width;
        localStorage.setItem(PREVIEW_WIDTH_KEY, String(width));
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement;
        if (this.editing || !this.columns.length || (target && /^(INPUT|TEXTAREA)$/.test(target.tagName))) return;
        let depth = -1;
        this.columns.forEach((c, i) => {
            if (c.selected) depth = i;
        });
        if (depth < 0) depth = this.columns.length - 1;
        const col = this.columns[depth];
        const rows = this.shown(col, depth);
        const idx = col.selected ? rows.findIndex(e => e.path === col.selected!.path) : -1;
        switch (event.key) {
            case 'ArrowDown':
                if (idx < rows.length - 1) this.select(depth, rows[idx + 1]);
                break;
            case 'ArrowUp':
                if (idx > 0) this.select(depth, rows[idx - 1]);
                break;
            case 'ArrowRight': {
                const next = this.columns[depth + 1];
                if (col.selected?.dir && next && next.entries.length) this.select(depth + 1, next.entries[0]);
                break;
            }
            case 'ArrowLeft':
                if (depth > 0) {
                    this.columns = this.columns.slice(0, depth + 1);
                    col.selected = null;
                    this.preview = null;
                }
                break;
            default:
                return;
        }
        event.preventDefault();
    }

}
