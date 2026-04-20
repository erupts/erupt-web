import {Injectable} from '@angular/core';

/**
 * 预处理 LaTeX 公式，统一转换为标准格式
 * 支持: ```latex 代码块、\[...\] 块级公式、\(...\) 行内公式
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
 * 仅由 AiModule 提供，不 providedIn root，便于 markdown/katex/mermaid 等随 AI 懒加载 chunk 加载。
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
                    const info = (lang || '').trim().split(/\s+/)[0] || '';
                    if (info.toLowerCase() === 'mermaid') {
                        return `<div class="mermaid">${str}</div>`;
                    }
                    if (info.toLowerCase() === 'echarts') {
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

    /** 提前触发懒加载，不等结果；组件初始化时调用可消除首次渲染延迟 */
    warmup(): void {
        this.init().catch(() => {
        });
    }

    async render(text: string): Promise<string> {
        if (!text) return '';
        await this.init();
        let html = this.md.render(preprocessLatex(text));
        // 为表格包一层 div，便于全局样式选择器命中（innerHTML 不受组件封装）
        html = html.replace(/<table(\s|>)/g, '<div class="markdown-table-wrap"><table$1');
        html = html.replace(/<\/table>/g, '</table></div>');
        return html;
    }

    /** 在容器内查找未渲染的 .mermaid 并执行渲染（应在 DOM 插入后由组件调用） */
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

    /** 在容器内查找未渲染的 .echarts-block 并执行渲染（应在 DOM 插入后由组件调用） */
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
