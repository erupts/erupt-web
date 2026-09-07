export type ConnState = 'connecting' | 'connected' | 'disconnected';

export interface TicketVo {
    ticket: string;
    name: string;
    protocol: 'VNC' | 'SSH' | string;
    passwordManaged: boolean;
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
