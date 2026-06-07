import {Injectable} from '@angular/core';

function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Render the loose diff output from AI into colored HTML lines, with optional syntax highlighting */
function renderDiffHtml(raw: string, hljs?: any, lang?: string): string {
    const hl = (code: string) => {
        if (hljs && lang && hljs.getLanguage(lang)) {
            try { return hljs.highlight(code, {language: lang}).value; } catch { /* fallback */ }
        }
        return escHtml(code);
    };
    const rows = raw.split('\n').map(line => {
        if (line.startsWith('- ') || line === '-') {
            return `<div class="diff-line diff-del"><span class="diff-sign">-</span><span class="diff-code">${hl(line.slice(2))}</span></div>`;
        } else if (line.startsWith('+ ') || line === '+') {
            return `<div class="diff-line diff-add"><span class="diff-sign">+</span><span class="diff-code">${hl(line.slice(2))}</span></div>`;
        } else {
            const content = line.startsWith('  ') ? line.slice(2) : line;
            return `<div class="diff-line diff-ctx"><span class="diff-sign"> </span><span class="diff-code">${hl(content)}</span></div>`;
        }
    }).join('');
    return `<div class="diff-block">${rows}</div>`;
}

/**
 * Pre-process LaTeX formulas, converting them to a standard format uniformly.
 * Supports: ```latex code blocks, \[...\] block-level formulas, \(...\) inline formulas
 */
function preprocessLatex(text: string): string {
    text = text.replace(/```latex\s*([\s\S]*?)```/g, (_match, content) => {
        return '\n' + (content as string).trim() + '\n';
    });
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula) => {
        return '$$' + (formula as string).trim() + '$$';
    });
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula) => {
        return '$' + (formula as string).trim() + '$';
    });
    return text;
}

/**
 * Provided only by AiModule, not providedIn root, so that markdown/katex/mermaid etc.
 * are loaded together with the AI lazy-loaded chunk.
 */
@Injectable()
export class MarkdownService {
    private md: any;
    private mermaid: any;
    private hljs: any;
    private initPromise: Promise<void> | null = null;

    private async init() {
        if (this.md) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            const [
                MarkdownIt,
                hljs,
                footnote,
                mark,
                sub,
                sup,
                ins,
                abbr,
                deflist,
                linkAttributes,
                taskLists,
                markdownItKatex,
                mermaid,
                container
            ] = await Promise.all([
                import('markdown-it').then(m => m.default),
                import('highlight.js').then(m => m.default),
                import('markdown-it-footnote').then(m => m.default),
                import('markdown-it-mark').then(m => m.default),
                import('markdown-it-sub').then(m => m.default),
                import('markdown-it-sup').then(m => m.default),
                import('markdown-it-ins').then(m => m.default),
                import('markdown-it-abbr').then(m => m.default),
                import('markdown-it-deflist').then(m => m.default),
                import('markdown-it-link-attributes').then(m => m.default),
                import('markdown-it-task-lists').then(m => m.default),
                import('markdown-it-katex').then(m => m.default),
                import('mermaid').then(m => m.default),
                import('markdown-it-container').then(m => m.default)
            ]);

            this.hljs = hljs;
            this.mermaid = mermaid;
            this.md = new MarkdownIt('default', {
                html: true,
                breaks: true,
                linkify: true,
                typographer: true,
                highlight: (str: string, lang: string) => {
                    const tokens = (lang || '').trim().split(/\s+/);
                    const info = tokens[0].toLowerCase();
                    if (info === 'mermaid') {
                        return `<div class="mermaid">${str}</div>`;
                    }
                    if (info === 'diff') {
                        return renderDiffHtml(str.trimEnd(), this.hljs, tokens[1] || '');
                    }
                    if (info === 'echarts') {
                        const encoded = encodeURIComponent(str.trim());
                        return `<div class="echarts-block" data-option="${encoded}" style="height:400px;">` +
                            `<div class="echarts-ph"></div></div>`;
                    }
                    const copyBtn = `<button class="code-copy-btn" onclick="const c=this.closest('.code-block-wrap').querySelector('code');navigator.clipboard.writeText(c.textContent||'').then(()=>{this.setAttribute('data-copied','');setTimeout(()=>this.removeAttribute('data-copied'),1500)})">Copy</button>`;
                    const langLabel = info ? `<span class="code-lang">${this.md.utils.escapeHtml(info)}</span>` : '';
                    const lineCount = str.replace(/\n$/, '').split('\n').length;
                    const gutter = `<div class="code-gutter">${Array.from({length: lineCount}, (_, i) => `<span>${i + 1}</span>`).join('')}</div>`;
                    if (info && this.hljs.getLanguage(info)) {
                        try {
                            const {value} = this.hljs.highlight(str, {language: info});
                            return `<div class="code-block-wrap">${langLabel}${copyBtn}<div class="code-inner">${gutter}<pre class="hljs"><code class="language-${info}">${value}</code></pre></div></div>`;
                        } catch {
                            // fallback
                        }
                    }
                    try {
                        const {value} = this.hljs.highlightAuto(str);
                        return `<div class="code-block-wrap">${langLabel}${copyBtn}<div class="code-inner">${gutter}<pre class="hljs"><code>${value}</code></pre></div></div>`;
                    } catch {
                        return `<div class="code-block-wrap">${langLabel}${copyBtn}<div class="code-inner">${gutter}<pre class="hljs"><code>${this.md.utils.escapeHtml(str)}</code></pre></div></div>`;
                    }
                }
            })
                .use(footnote)
                .use(mark)
                .use(sub)
                .use(sup)
                .use(ins)
                .use(abbr)
                .use(deflist)
                .use(linkAttributes, {attrs: {target: '_blank', rel: 'noopener'}})
                .use(taskLists)
                .use(markdownItKatex, {throwOnError: false, errorColor: '#cc0000'});

            const calloutTypes: Record<string, { icon: string; label: string }> = {
                tip: {icon: '💡', label: 'Tip'},
                info: {icon: 'ℹ️', label: 'Info'},
                warning: {icon: '⚠️', label: 'Warning'},
                danger: {icon: '🚨', label: 'Danger'},
                note: {icon: '📝', label: 'Note'},
            };
            for (const [type, meta] of Object.entries(calloutTypes)) {
                this.md.use(container, type, {
                    render(tokens: any[], idx: number) {
                        const token = tokens[idx];
                        if (token.nesting === 1) {
                            const customTitle = token.info.trim().slice(type.length).trim();
                            const title = customTitle || `${meta.icon} ${meta.label}`;
                            return `<div class="callout callout-${type}"><div class="callout-title">${title}</div><div class="callout-body">\n`;
                        }
                        return '</div></div>\n';
                    }
                });
            }
        })();

        return this.initPromise;
    }

    /** Trigger lazy loading in advance without waiting for the result; call during component initialization to eliminate first-render delay */
    warmup(): void {
        this.init().catch(() => {
        });
    }

    async render(text: string): Promise<string> {
        if (!text) return '';
        await this.init();
        let html = this.md.render(preprocessLatex(text));
        // wrap tables in a div so global style selectors can match (innerHTML is not scoped by component encapsulation)
        html = html.replace(/<table(\s|>)/g, '<div class="markdown-table-wrap"><table$1');
        html = html.replace(/<\/table>/g, '</table></div>');
        return html;
    }

    /** Find unrendered .mermaid elements in the container and render them (should be called by the component after DOM insertion) */
    async runMermaid(container: HTMLElement): Promise<void> {
        const nodeList = container.querySelectorAll('.mermaid:not([data-processed])');
        if (nodeList.length === 0) return;
        await this.init();
        const nodes = Array.from(nodeList) as HTMLElement[];
        try {
            this.mermaid.run({nodes});
        } catch (e) {
            console.warn('mermaid.run error', e);
        }
    }

    /** Find unrendered .echarts-block elements in the container and render them (should be called by the component after DOM insertion) */
    async runEcharts(container: HTMLElement): Promise<void> {
        const nodeList = container.querySelectorAll('.echarts-block:not([data-processed])');
        if (nodeList.length === 0) return;
        const echarts = await import('echarts');
        for (const node of Array.from(nodeList) as HTMLElement[]) {
            node.setAttribute('data-processed', 'true');
            node.querySelector('.echarts-ph')?.remove();
            try {
                const option = JSON.parse(decodeURIComponent((node as HTMLElement).dataset['option'] || '{}'));
                const chart = echarts.init(node, null, {width: node.offsetWidth || (node.parentElement?.offsetWidth ?? 600)});
                chart.setOption(option);
            } catch (e) {
                console.warn('echarts render error', e, node);
            }
        }
    }
}
