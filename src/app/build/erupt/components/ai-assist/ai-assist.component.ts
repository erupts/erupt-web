import {Component, Input, OnDestroy} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd/message';
import {EruptFieldModel} from '../../model/erupt-field.model';
import {EruptModel, Power} from '../../model/erupt.model';
import {EditType} from '../../model/erupt.enum';
import {AiFieldAction, AiFieldService} from '../../service/ai-field.service';
import {EruptAppData} from '@shared/model/erupt-app.model';

/** How the trigger renders; the host picks by how much room it has */
export enum AiAssistVariant {
    /** Bare 22px glyph, for a slot too narrow for words */
    ICON = 'icon',
    /** Glyph plus the word "AI" — what actually makes the control findable */
    PILL = 'pill'
}

/**
 * Inline writing assistant attached to a single text-bearing form field.
 *
 * It drafts the field's value with the rest of the form as its brief, which is the part no
 * generic copilot can do: the schema says what every sibling field means.
 */
@Component({
    standalone: false,
    selector: 'erupt-ai-assist',
    templateUrl: './ai-assist.component.html',
    styleUrls: ['./ai-assist.component.less']
})
export class AiAssistComponent implements OnDestroy {

    @Input() eruptModel: EruptModel;

    @Input() eruptField: EruptFieldModel;

    @Input() parentEruptName: string;

    /** Model-level power; @Power(ai = false) keeps AI away from the whole record */
    @Input() power: Power;

    @Input() disabled: boolean = false;

    /**
     * ICON suits hosts with no room to spare (an input's suffix slot); PILL belongs
     * wherever there is horizontal space, which is every editor with a tray.
     */
    @Input() variant: AiAssistVariant = AiAssistVariant.ICON;

    /** Exposed so the template can name actions instead of repeating string literals */
    action = AiFieldAction;

    variantEnum = AiAssistVariant;

    /**
     * The glyph is filled by an SVG gradient, which can only be referenced by id.
     * Every instance gets its own: a shared id would resolve to whichever copy sits
     * first in the document, and the rest would lose their fill the moment that one
     * unmounted with its modal.
     */
    private static gradientSeq: number = 0;

    readonly gradientId: string = `ai-spark-${++AiAssistComponent.gradientSeq}`;

    panelVisible: boolean = false;

    promptFocused: boolean = false;

    running: boolean = false;

    instruction: string = '';

    /** Value the field held before the last run, so one click puts it back */
    private previousValue: any = null;

    canUndo: boolean = false;

    private abort: AbortController | null = null;

    /** Rich editors rebuild themselves on every write, so they get batched instead of per-token */
    private flushTimer: any = null;

    private pending: string | null = null;

    constructor(private aiFieldService: AiFieldService,
                private msg: NzMessageService) {
    }

    ngOnDestroy(): void {
        this.stop();
    }

    private get edit() {
        return this.eruptField.eruptFieldJson.edit;
    }

    /** Present only when the ai module is deployed and the field did not opt out */
    get enabled(): boolean {
        if (!EruptAppData.get().properties['erupt-ai'] || this.edit.ai === false) return false;
        if (this.power && this.power.ai === false) return false;
        // An INPUT bound to a number, date or email has no prose to draft
        if (this.edit.type === EditType.INPUT) {
            const inputType = this.edit.inputType?.type;
            return !inputType || inputType === 'text';
        }
        return true;
    }

    get hasContent(): boolean {
        const value = this.edit.$value;
        return typeof value === 'string' && value.trim().length > 0;
    }

    /** Length cap the component enforces; the stream is clipped to it so the form stays saveable */
    private get maxLength(): number | null {
        const length = this.edit.type === EditType.INPUT
            ? this.edit.inputType?.length
            : this.edit.type === EditType.TEXTAREA ? this.edit.textareaType?.length : null;
        // The backend treats a very large cap as "unlimited"; mirror that rather than clipping
        return length && length > 0 && length < 9999 ? length : null;
    }

    private clip(text: string): string {
        const max = this.maxLength;
        return max && text.length > max ? text.slice(0, max) : text;
    }

    /** A rich editor repaints wholesale; writing every token into it fights the cursor */
    private get batched(): boolean {
        return this.edit.type === EditType.HTML_EDITOR || this.edit.type === EditType.MARKDOWN;
    }

    run(action: AiFieldAction): void {
        if (this.running || this.disabled) return;
        if (action === AiFieldAction.CUSTOM && !this.instruction.trim()) return;
        this.panelVisible = false;
        this.previousValue = this.edit.$value;
        this.canUndo = false;
        this.running = true;
        this.abort = new AbortController();

        // CONTINUE appends to what is there; every other action replaces the field
        const append = action === AiFieldAction.CONTINUE;
        let draft = append ? (this.edit.$value || '') : '';
        if (!append) this.edit.$value = '';

        this.aiFieldService.generate(
            this.eruptModel.eruptName, this.eruptField.fieldName, this.parentEruptName,
            {
                action,
                instruction: this.instruction.trim() || undefined,
                current: typeof this.previousValue === 'string' ? this.previousValue : undefined,
                form: this.collectForm()
            },
            token => {
                draft += token;
                if (this.batched) {
                    this.pending = draft;
                    this.scheduleFlush();
                } else {
                    this.edit.$value = this.clip(draft);
                }
            },
            this.abort.signal
        ).then(() => {
            this.finish(draft);
        }).catch(e => {
            if (e?.name === 'AbortError') {
                this.finish(draft);
                return;
            }
            this.edit.$value = this.previousValue;
            this.finish(null);
            this.msg.error(e?.message || 'AI request failed');
        });
    }

    private scheduleFlush(): void {
        if (this.flushTimer !== null) return;
        this.flushTimer = setTimeout(() => {
            this.flushTimer = null;
            if (this.pending !== null) {
                this.edit.$value = this.clip(this.pending);
                this.pending = null;
            }
        }, 200);
    }

    private finish(draft: string | null): void {
        if (this.flushTimer !== null) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        this.pending = null;
        if (draft !== null) {
            this.edit.$value = this.clip(draft);
            this.canUndo = true;
        }
        this.running = false;
        this.abort = null;
        this.instruction = '';
    }

    /** While a draft streams the trigger is a stop button, so the panel must not open */
    onTriggerClick(event: MouseEvent): void {
        event.stopPropagation();
        if (this.running) this.stop();
    }

    stop(): void {
        if (this.abort) this.abort.abort();
    }

    undo(): void {
        this.edit.$value = this.previousValue;
        this.canUndo = false;
        this.panelVisible = false;
    }

    /**
     * Sibling values, flattened to what a prompt can use. Values the backend refuses to forward
     * (a password, an attachment) are dropped there — this only has to keep the payload sane.
     */
    private collectForm(): { [key: string]: any } {
        const form: { [key: string]: any } = {};
        for (const field of this.eruptModel.eruptFieldModels) {
            const edit = field.eruptFieldJson.edit;
            if (!edit || field.fieldName === this.eruptField.fieldName) continue;
            const value = edit.$value;
            if (value === null || value === undefined || value === '') continue;
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                form[field.fieldName] = value;
            } else if (value instanceof Date) {
                form[field.fieldName] = value.toISOString();
            } else if (Array.isArray(value)) {
                form[field.fieldName] = value.filter(it => typeof it !== 'object').join(', ');
            } else if (typeof value === 'object' && value.label) {
                // A reference field carries the picked row; its label is the readable part
                form[field.fieldName] = value.label;
            }
        }
        return form;
    }

}
