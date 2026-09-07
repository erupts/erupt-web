// # 3rd Party Library
// If the library doesn't have typings available at `@types/`,
// you can still use it by manually adding typings for it

// Fix for @worktile/gantt compatibility with date-fns 4.x
declare module 'date-fns/locale' {
  export interface Locale {
    code: string;
    localize: any;
    formatLong: any;
    formatRelative: any;
    match: any;
    options?: {
      weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
      firstWeekContainsDate?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    };
  }
}

declare module 'date-fns' {
  export type FirstWeekContainsDate = 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

// noVNC ships no type definitions; declare the subset used by the remote desktop page
declare module '@novnc/novnc/lib/rfb.js' {
    export default class RFB extends EventTarget {
        constructor(target: HTMLElement, urlOrChannel: string | WebSocket, options?: {
            shared?: boolean;
            credentials?: { username?: string; password?: string; target?: string };
            repeaterID?: string;
            wsProtocols?: string[];
        });

        viewOnly: boolean;
        focusOnClick: boolean;
        clipViewport: boolean;
        dragViewport: boolean;
        scaleViewport: boolean;
        resizeSession: boolean;
        showDotCursor: boolean;
        background: string;
        qualityLevel: number;
        compressionLevel: number;
        readonly capabilities: { power: boolean };

        disconnect(): void;
        sendCredentials(credentials: { username?: string; password?: string; target?: string }): void;
        sendKey(keysym: number, code: string | null, down?: boolean): void;
        sendCtrlAltDel(): void;
        focus(options?: FocusOptions): void;
        blur(): void;
        machineShutdown(): void;
        machineReboot(): void;
        machineReset(): void;
        clipboardPasteFrom(text: string): void;
    }
}
