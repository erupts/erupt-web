import { Injectable } from '@angular/core';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import footnote from 'markdown-it-footnote';
import mark from 'markdown-it-mark';
import sub from 'markdown-it-sub';
import sup from 'markdown-it-sup';
import ins from 'markdown-it-ins';
import abbr from 'markdown-it-abbr';
import deflist from 'markdown-it-deflist';
import linkAttributes from 'markdown-it-link-attributes';
import taskLists from 'markdown-it-task-lists';
import markdownItKatex from 'markdown-it-katex';
import mermaid from 'mermaid';

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
    private md: MarkdownIt;

    constructor() {
        // 使用 'default' 预设以启用 GFM 表格；'commonmark' 不含表格
        const md = new MarkdownIt('default', {
            html: true,
            breaks: true,
            linkify: true,
            typographer: true,
            highlight: (str: string, lang: string) => {
                const info = (lang || '').trim().split(/\s+/)[0] || '';
                if (info.toLowerCase() === 'mermaid') {
                    return `<div class="mermaid">${str}</div>`;
                }
                if (info && hljs.getLanguage(info)) {
                    try {
                        const { value } = hljs.highlight(str, { language: info });
                        return `<pre class="hljs"><code class="language-${info}">${value}</code></pre>`;
                    } catch {
                        // fallback to auto or plain
                    }
                }
                try {
                    const { value } = hljs.highlightAuto(str);
                    return `<pre class="hljs"><code>${value}</code></pre>`;
                } catch {
                    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
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
            .use(linkAttributes, { attrs: { target: '_blank', rel: 'noopener' } })
            .use(taskLists)
            .use(markdownItKatex, { throwOnError: false, errorColor: '#cc0000' });

        this.md = md;
        // // 流程图等 SVG 带明确宽高，避免 useMaxWidth 时高度由浏览器计算导致撑开整页
        // mermaid.initialize({
        //     startOnLoad: false,
        //     flowchart: { useMaxWidth: false },
        //     sequence: { useMaxWidth: false },
        // });
    }

    render(text: string): string {
        if (!text) return '';
        let html = this.md.render(preprocessLatex(text));
        // 为表格包一层 div，便于全局样式选择器命中（innerHTML 不受组件封装）
        html = html.replace(/<table(\s|>)/g, '<div class="markdown-table-wrap"><table$1');
        html = html.replace(/<\/table>/g, '</table></div>');
        return html;
    }

    /** 在容器内查找未渲染的 .mermaid 并执行渲染（应在 DOM 插入后由组件调用） */
    runMermaid(container: HTMLElement): void {
        const nodeList = container.querySelectorAll('.mermaid:not([data-processed])');
        if (nodeList.length === 0) return;
        const nodes = Array.from(nodeList) as HTMLElement[];
        try {
            mermaid.run({ nodes });
        } catch (e) {
            console.warn('mermaid.run error', e);
        }
    }
}
