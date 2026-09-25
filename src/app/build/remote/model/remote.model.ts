export type ConnState = 'connecting' | 'connected' | 'disconnected';

export interface TicketVo {
    ticket: string;
    name: string;
    protocol: 'VNC' | 'SSH' | string;
    passwordManaged: boolean;
    /** SSH hosts only: whether the SFTP file panel is offered */
    fileTransfer: boolean;
}

// Close codes emitted by the backend endpoint, mapped to user-facing messages
export const CLOSE_MESSAGES: Record<number, string> = {
    4001: 'Session ticket is invalid or has expired',
    4002: 'Remote host is unavailable',
    4003: 'You are not allowed to open this host',
    4004: 'Too many concurrent remote sessions',
    4005: 'Could not reach the remote host',
    4006: 'Authentication failed',
    4007: 'Disconnected after being idle'
};

export function describeClose(close: { code: number; reason: string } | null, fallback = 'Disconnected'): string {
    if (!close) return fallback;
    if (CLOSE_MESSAGES[close.code]) {
        return CLOSE_MESSAGES[close.code] + (close.code === 4005 && close.reason ? ` (${close.reason})` : '');
    }
    return close.reason || fallback;
}

export function remoteWsUrl(token: string, ticket: string): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${location.host}/erupt-remote?token=${encodeURIComponent(token)}&ticket=${encodeURIComponent(ticket)}`;
}

export interface SftpEntry {
    name: string;
    directory: boolean;
    size: number;
    mtime: number;
    mode: string;
}

export interface UploadItem {
    name: string;
    percent: number;
    error?: string;
    done?: boolean;
}

export function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    const units = ['KB', 'MB', 'GB', 'TB'];
    let v = bytes / 1024, i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return (v >= 100 ? v.toFixed(0) : v.toFixed(1)) + ' ' + units[i];
}

export function parentPath(path: string): string {
    const i = path.lastIndexOf('/');
    return i <= 0 ? '/' : path.substring(0, i);
}

export function joinPath(dir: string, name: string): string {
    return dir === '/' ? '/' + name : dir + '/' + name;
}
