import {Inject, Injectable} from "@angular/core";
import {WindowModel} from "@shared/model/window.model";
import {NzMessageService} from "ng-zorro-antd/message";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

@Injectable()
export class SocketService {

    private socket: WebSocket;
    private heartBeatTimer: any;
    private reconnectTimer: any;
    private reconnectCount = 0;
    private destroyed = false;

    private readonly reconnectInterval = 5000;
    private readonly heartbeatInterval = 5000;

    constructor(
        @Inject(NzMessageService) private msg: NzMessageService,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    public initWebSocket(): void {
        this.destroyed = false;
        this.reconnectCount = 0;
        this.connect();
    }

    private connect(): void {
        const url = this.buildWsUrl() + 'erupt-websocket?token=' + this.tokenService.get().token;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            this.reconnectCount = 0;
            this.startHeartbeat();
        };

        this.socket.onmessage = (event) => {
            const data = <any[]>JSON.parse(event.data);
            if (data?.[0] === 'js') {
                try {
                    new Function(data[1])();
                } catch (e) {
                    this.msg.warning('WebSocket JS execution error: ' + e);
                }
            }
        };

        this.socket.onerror = (event) => {
            console.error('WebSocket error', event);
        };

        this.socket.onclose = (event) => {
            console.log(`WebSocket closed — code: ${event.code}, reason: ${event.reason || 'none'}`);
            this.clearHeartbeatTimer();
            // code 1002: token error, skip reconnect
            if (!this.destroyed && event.code !== 1002) {
                this.scheduleReconnect();
            }
        };
    }

    private buildWsUrl(): string {
        const base = WindowModel.domain || (location.protocol + '//' + location.host + location.pathname);
        return base.replace(/^http/, 'ws').replace(/\/?$/, '/');
    }

    private scheduleReconnect(): void {
        this.reconnectCount++;
        console.log(`WebSocket reconnecting (attempt ${this.reconnectCount})...`);
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectInterval);
    }

    closeSocket(): void {
        this.destroyed = true;
        this.clearHeartbeatTimer();
        clearTimeout(this.reconnectTimer);
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    clearHeartbeatTimer(): void {
        if (this.heartBeatTimer) {
            clearInterval(this.heartBeatTimer);
            this.heartBeatTimer = null;
        }
    }

    startHeartbeat(): void {
        this.clearHeartbeatTimer();
        this.heartBeatTimer = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify(['ping']));
            }
        }, this.heartbeatInterval);
    }

    sendMessage(command: string, data: any): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify([command, data]));
        } else {
            console.warn('WebSocket not connected, unable to send message.', data);
        }
    }

}
