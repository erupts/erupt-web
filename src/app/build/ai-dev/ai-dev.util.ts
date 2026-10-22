import {Stage} from './ai-dev.service';

/** Tone of a stage badge, styled by the page's own palette. */
export function stageTone(stage: Stage): string {
    switch (stage) {
        case 'REVIEW':
            return 'violet';
        case 'QUEUED':
        case 'RUNNING':
        case 'VERIFYING':
            return 'amber';
        case 'ACCEPTANCE':
            return 'blue';
        case 'DELIVERED':
            return 'green';
        case 'FAILED':
            return 'red';
        default:
            return 'gray';
    }
}

/** Where a stage sits in the four steps a requirement goes through. */
export type Step = 'define' | 'review' | 'run' | 'deliver';

export function stepOf(stage: Stage): Step {
    switch (stage) {
        case 'REVIEW':
            return 'review';
        case 'QUEUED':
        case 'RUNNING':
        case 'VERIFYING':
        case 'FAILED':
            return 'run';
        case 'ACCEPTANCE':
        case 'DELIVERED':
            return 'deliver';
        default:
            return 'define';
    }
}

export const STEPS: Step[] = ['define', 'review', 'run', 'deliver'];

export type StepState = 'done' | 'current' | 'todo' | 'failed';

/** How far a requirement in this stage got with a step. */
export function stepState(stage: Stage, step: Step): StepState {
    if (stage === 'DELIVERED') return 'done';
    const at = STEPS.indexOf(stepOf(stage)), i = STEPS.indexOf(step);
    if (i < at) return 'done';
    if (i > at) return 'todo';
    return stage === 'FAILED' || stage === 'CANCELLED' ? 'failed' : 'current';
}

/** The agent's phases and the progress range each covers, as the prompts ask it to report them. */
export const PHASES = [
    {key: 'assess', from: 0, to: 20},
    {key: 'design', from: 20, to: 40},
    {key: 'implement', from: 40, to: 70},
    {key: 'verify', from: 70, to: 90},
    {key: 'release', from: 90, to: 100}
];

// "2h 3m", "4m 12s", "38s"
export function duration(from: string | null, to: string | null): string {
    if (!from) return '';
    const ms = (to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime();
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return s + 's';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ' + (s % 60) + 's';
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
}

// 2.3k, 1.2M
export function compact(n: number | null): string {
    if (n == null) return '';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
    return String(n);
}

// one letter for an avatar
export function initial(name: string | null): string {
    return (name || '?').trim().charAt(0).toUpperCase();
}

// a stable avatar color per person
export function avatarTone(name: string | null): string {
    let h = 0;
    for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return 'c' + (h % 5 + 1);
}
