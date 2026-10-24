import {Component, Input} from '@angular/core';

// the built-in CLIs' logos (LobeHub Icons, MIT, see assets/ai-dev/cli/README.md); a single-color one is drawn
// as a mask in the text color, so it follows the theme
const LOGOS: { [code: string]: { file: string, mono: boolean } } = {
    claude: {file: 'claude.svg', mono: false},
    codex: {file: 'codex.svg', mono: false},
    opencode: {file: 'opencode.svg', mono: false},
    kimi: {file: 'kimi.svg', mono: false},
    cursor: {file: 'cursor.svg', mono: true},
    qwen: {file: 'qwen.svg', mono: false}
};

const LOGO_DIR = 'assets/ai-dev/cli/';

// a CLI with neither a configured icon nor a logo: its initials on a color
const BADGES: { [code: string]: { text: string, color: string } } = {
    claude: {text: 'Cl', color: '#d97757'},
    codex: {text: 'Cx', color: '#10a37f'},
    opencode: {text: 'OC', color: '#27272a'},
    kimi: {text: 'K', color: '#1f6feb'},
    cursor: {text: 'Cu', color: '#111111'},
    qwen: {text: 'Q', color: '#615ced'}
};

const OTHERS = ['#13c2c2', '#722ed1', '#fa8c16', '#eb2f96', '#2f54eb'];

/**
 * The logo of a coding CLI: its configured icon, else a badge of its initials in its own color, so the
 * executor reads at a glance in the list, the board and the agent's messages.
 */
@Component({
    standalone: false,
    selector: 'ad-cli-logo',
    template: `
        @if (icon) {
            <img class="ad-cli" [src]="icon" [alt]="label || code" [title]="label || code"
                 [style.width.px]="size" [style.height.px]="size">
        } @else if (logo(); as l) {
            @if (l.mono) {
                <span class="ad-cli ad-cli-mono" [title]="label || code" [style.width.px]="size" [style.height.px]="size"
                      [style.maskImage]="'url(' + l.src + ')'" [style.webkitMaskImage]="'url(' + l.src + ')'"></span>
            } @else {
                <img class="ad-cli" [src]="l.src" [alt]="label || code" [title]="label || code"
                     [style.width.px]="size" [style.height.px]="size">
            }
        } @else {
            <span class="ad-cli" [title]="label || code" [style.width.px]="size" [style.height.px]="size"
                  [style.lineHeight.px]="size" [style.fontSize.px]="size * 0.42" [style.background]="badge().color">{{ badge().text }}</span>
        }
    `,
    styles: [`
        :host {
            display: inline-flex;
            flex-shrink: 0;
            vertical-align: middle;
        }

        .ad-cli-mono {
            background: var(--erupt-text, rgba(0, 0, 0, 0.85));
            -webkit-mask: center / contain no-repeat;
            mask: center / contain no-repeat;
            border-radius: 0;
        }

        .ad-cli {
            display: inline-block;
            border-radius: 6px;
            object-fit: contain;
            text-align: center;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #fff;
            user-select: none;
        }
    `]
})
export class AdCliLogoComponent {

    @Input() code: string | null = null;

    @Input() icon: string | null = null;

    @Input() label: string | null = null;

    @Input() size = 24;

    private key(): string {
        return (this.code || '').toLowerCase().replace('claude_code', 'claude');
    }

    logo(): { src: string, mono: boolean } | null {
        const logo = LOGOS[this.key()];
        return logo ? {src: LOGO_DIR + logo.file, mono: logo.mono} : null;
    }

    badge(): { text: string, color: string } {
        const code = this.key();
        if (BADGES[code]) return BADGES[code];
        const name = this.label || this.code || '?';
        let h = 0;
        for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
        return {text: name.trim().charAt(0).toUpperCase(), color: OTHERS[Math.abs(h) % OTHERS.length]};
    }

}
