import {Component, Input, OnChanges} from '@angular/core';

// one parser for the page, loaded with the first text that needs it
let parser: Promise<any> | null = null;

function markdownIt(): Promise<any> {
    if (!parser) {
        parser = Promise.all([import('markdown-it'), import('highlight.js')]).then(([md, hl]) => {
            const hljs = hl.default;
            return new md.default({
                // agent output is untrusted: raw HTML in it stays text, never markup
                html: false,
                linkify: true,
                breaks: true,
                highlight: (code: string, lang: string) => {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, {language: lang}).value;
                        } catch {
                            // falls back to plain text below
                        }
                    }
                    return '';
                }
            });
        });
    }
    return parser;
}

/**
 * Markdown from an agent or a requirement, rendered without raw HTML and bound through Angular's own
 * sanitizer (no bypass), so nothing it carries can run in the page. Plain text shows until the parser loads.
 */
@Component({
    standalone: false,
    selector: 'ad-markdown',
    template: `
        @if (html !== null) {
            <div class="ad-md" [innerHTML]="html"></div>
        } @else {
            <div class="ad-md ad-md-plain">{{ text }}</div>
        }
    `,
    styleUrls: ['./ad-markdown.component.less']
})
export class AdMarkdownComponent implements OnChanges {

    @Input() text: string | null = null;

    html: string | null = null;

    private rendered: string | null = null;

    ngOnChanges(): void {
        const text = this.text || '';
        if (text === this.rendered) return;
        this.rendered = text;
        markdownIt().then(md => {
            // a newer text may have arrived while the parser loaded
            if (this.rendered === text) this.html = md.render(text);
        }).catch(() => this.html = null);
    }

}
