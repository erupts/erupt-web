import {Inject, Injectable} from "@angular/core";
import {WindowModel} from "@shared/model/window.model";
import {NzMessageService} from "ng-zorro-antd/message";
import {DA_SERVICE_TOKEN, ITokenService} from "@delon/auth";

@Injectable()
export class SocketService {

    private socket: WebSocket;

    private heartBeatTimer: any;

    // 重连间隔时间（毫秒）
    private reconnectInterval: number = 5000;

    // 重连次数
    private reconnectAttempts: number = 0;

    constructor(
        @Inject(NzMessageService) private msg: NzMessageService,
        @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService) {
    }

    public initWebSocket(): void {
        this.reconnectAttempts = 0;
        let websocketUrl: string;
        if (WindowModel.domain) {
            websocketUrl = (WindowModel.domain.startsWith('http:') ? 'ws:' : 'wss:') + location.host.split(":")[1] + "/";
        } else {
            websocketUrl = (location.protocol === 'http:' ? 'ws:' : 'wss:') + "//" + location.host + location.pathname;
        }
        this.socket = new WebSocket(websocketUrl + 'erupt?token=' + this.tokenService.get().token);

        this.socket.onopen = () => {
            // 启动心跳
            this.startHeartbeat();
        };

        this.socket.onmessage = (event) => {
            let data = <any[]>JSON.parse(event.data);
            if (data?.[0] == "js") {
                try {
                    eval(data[1])
                } catch (e) {
                    this.msg.warning("socket js err: " + e);
                }
            }
            // TODO broadcast
        };

        this.socket.onerror = (event) => {
            console.error("socket error", event)
        };

        this.socket.onclose = (event) => {
            console.log("WebSocket连接已关闭，关闭原因：", event.code, event.reason);
            //1002 token error
            if (event.code != 1002) {
                setTimeout(reconnect, this.reconnectInterval);
            }
        };

        let reconnect = () => {
            this.reconnectAttempts++;
            this.clearHeartbeatTimer();
            console.log("正在进行第", this.reconnectAttempts, "次 websocket 重连尝试...");
            this.closeSocket();
            this.initWebSocket();
        }

    }

    closeSocket() {
        if (this.socket) {
            this.socket.close();
        }
    }

    clearHeartbeatTimer() {
        if (this.heartBeatTimer) {
            clearInterval(this.heartBeatTimer);
            this.heartBeatTimer = null;
        }
    }

    startHeartbeat() {
        this.clearHeartbeatTimer();
        // 设置心跳定时器，每隔HEARTBEAT_INTERVAL毫秒发送一次心跳
        this.heartBeatTimer = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify(["ping"]));
            } else {
                console.log("WebSocket未连接，无法发送心跳消息。");
            }
        }, 5000);
    }

    sendMessage(command: string, data: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify([command, data]));
        } else {
            console.log("WebSocket未连接，无法发送消息。", data);
        }
    }

}
