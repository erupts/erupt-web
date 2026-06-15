import {AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild} from '@angular/core';
import {I18NService} from '@core';
import {MonitorService} from '../../service/monitor.service';
import {Platform, Server} from '../../model/monitor.model';

@Component({
    standalone: false,
    selector: 'app-monitor-server',
    templateUrl: './server.component.html',
    styleUrls: ['./server.component.less', '../../monitor.shared.less']
})
export class ServerComponent implements AfterViewInit, OnDestroy {

    loading: boolean = true;
    refreshing: boolean = false;
    autoRefresh: boolean = true;
    lastUpdate: string = '';

    server: Server = {
        cpu: {} as any, mem: {} as any, jvm: {} as any, sys: {}, gpus: [], io: {} as any, sysFiles: []
    } as Server;

    platform: Platform = {} as Platform;

    @ViewChild('trend', {static: false}) trendRef: ElementRef<HTMLDivElement>;
    @ViewChild('ioChart', {static: false}) ioRef: ElementRef<HTMLDivElement>;

    private trendChart: any;
    private ioChartIns: any;
    private cpuHistory: number[] = [];
    private memHistory: number[] = [];
    private ioHistory = {recv: [] as number[], sent: [] as number[], read: [] as number[], write: [] as number[]};
    private xAxis: string[] = [];
    private ioXAxis: string[] = [];
    private timer: any;
    private resize = () => {
        this.trendChart?.resize();
        this.ioChartIns?.resize();
    };
    private onVisible = () => {
        if (document.hidden) {
            this.stopTimer();
        } else if (this.autoRefresh) {
            this.startTimer();
        }
    };

    constructor(private monitorService: MonitorService,
                private i18n: I18NService,
                private zone: NgZone) {
    }

    async ngAfterViewInit(): Promise<void> {
        const echarts = await import('echarts');
        this.zone.runOutsideAngular(() => {
            this.initTrend(echarts);
            this.initIoChart(echarts);
            window.addEventListener('resize', this.resize);
        });
        this.load(false);
        this.monitorService.platform().subscribe(res => this.platform = res);
        if (this.autoRefresh) {
            this.startTimer();
        }
        document.addEventListener('visibilitychange', this.onVisible);
    }

    ngOnDestroy(): void {
        this.stopTimer();
        window.removeEventListener('resize', this.resize);
        document.removeEventListener('visibilitychange', this.onVisible);
        this.trendChart?.dispose();
        this.ioChartIns?.dispose();
    }

    refresh(): void {
        this.refreshing = true;
        this.load(true);
    }

    toggleAuto(on: boolean): void {
        this.autoRefresh = on;
        on ? this.startTimer() : this.stopTimer();
    }

    usageColor(usage: number | string): string {
        const p = +usage || 0;
        return p >= 90 ? '#ff4d4f' : p >= 70 ? '#faad14' : '#52c41a';
    }

    private startTimer(): void {
        this.stopTimer();
        this.timer = setInterval(() => this.load(true), 5000);
    }

    private stopTimer(): void {
        clearInterval(this.timer);
        this.timer = null;
    }

    private load(waitCpu: boolean): void {
        this.monitorService.serverInfo(waitCpu).subscribe({
            next: data => {
                data.cpu.usage = this.parseUsage(data.cpu.usage);
                data.mem.usage = this.parseUsage(data.mem.usage);
                data.jvm.usage = this.parseUsage(data.jvm.usage);
                this.server = data;
                this.loading = false;
                this.refreshing = false;
                this.lastUpdate = this.nowTime();
                this.pushTrend(+data.cpu.usage, +data.mem.usage);
                this.pushIo(data.io);
            },
            error: () => {
                this.loading = false;
                this.refreshing = false;
            }
        });
    }

    private pushTrend(cpu: number, mem: number): void {
        this.cpuHistory.push(cpu);
        this.memHistory.push(mem);
        this.xAxis.push(this.lastUpdate);
        if (this.cpuHistory.length > 30) {
            this.cpuHistory.shift();
            this.memHistory.shift();
            this.xAxis.shift();
        }
        this.trendChart?.setOption({
            xAxis: {data: this.xAxis},
            series: [{data: this.cpuHistory}, {data: this.memHistory}]
        });
    }

    private initTrend(echarts: any): void {
        this.trendChart = echarts.init(this.trendRef.nativeElement);
        this.trendChart.setOption({
            color: ['#1890ff', '#52c41a'],
            tooltip: {trigger: 'axis', valueFormatter: (v: number) => v + '%'},
            legend: {data: ['CPU', this.i18n.fanyi('monitor.server.memory')], top: 0, right: 0},
            grid: {left: 44, right: 16, top: 36, bottom: 28},
            xAxis: {type: 'category', boundaryGap: false, data: []},
            yAxis: {type: 'value', max: 100, axisLabel: {formatter: '{value}%'}},
            series: [
                {name: 'CPU', type: 'line', smooth: true, showSymbol: false, areaStyle: {opacity: 0.15}, data: []},
                {name: this.i18n.fanyi('monitor.server.memory'), type: 'line', smooth: true, showSymbol: false, areaStyle: {opacity: 0.15}, data: []}
            ]
        });
    }

    private pushIo(io: any): void {
        if (!io) return;
        this.ioHistory.recv.push(io.netRecv || 0);
        this.ioHistory.sent.push(io.netSent || 0);
        this.ioHistory.read.push(io.diskRead || 0);
        this.ioHistory.write.push(io.diskWrite || 0);
        this.ioXAxis.push(this.lastUpdate);
        if (this.ioXAxis.length > 30) {
            this.ioHistory.recv.shift();
            this.ioHistory.sent.shift();
            this.ioHistory.read.shift();
            this.ioHistory.write.shift();
            this.ioXAxis.shift();
        }
        this.ioChartIns?.setOption({
            xAxis: {data: this.ioXAxis},
            series: [
                {data: this.ioHistory.recv}, {data: this.ioHistory.sent},
                {data: this.ioHistory.read}, {data: this.ioHistory.write}
            ]
        });
    }

    private initIoChart(echarts: any): void {
        this.ioChartIns = echarts.init(this.ioRef.nativeElement);
        this.ioChartIns.setOption({
            color: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f'],
            tooltip: {trigger: 'axis', valueFormatter: (v: number) => this.formatRate(v)},
            legend: {
                data: [
                    this.i18n.fanyi('monitor.server.net_recv'), this.i18n.fanyi('monitor.server.net_sent'),
                    this.i18n.fanyi('monitor.server.disk_read'), this.i18n.fanyi('monitor.server.disk_write')
                ], top: 0, right: 0
            },
            grid: {left: 64, right: 16, top: 36, bottom: 28},
            xAxis: {type: 'category', boundaryGap: false, data: []},
            yAxis: {type: 'value', axisLabel: {formatter: (v: number) => this.formatRate(v)}},
            series: [
                {name: this.i18n.fanyi('monitor.server.net_recv'), type: 'line', smooth: true, showSymbol: false, areaStyle: {opacity: 0.1}, data: []},
                {name: this.i18n.fanyi('monitor.server.net_sent'), type: 'line', smooth: true, showSymbol: false, areaStyle: {opacity: 0.1}, data: []},
                {name: this.i18n.fanyi('monitor.server.disk_read'), type: 'line', smooth: true, showSymbol: false, data: []},
                {name: this.i18n.fanyi('monitor.server.disk_write'), type: 'line', smooth: true, showSymbol: false, data: []}
            ]
        });
    }

    private formatRate(bytes: number): string {
        if (!bytes) return '0 B/s';
        const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    }

    private parseUsage(usage: number | string): number {
        if (typeof usage === 'number') return usage;
        return parseFloat(String(usage).replace('%', '')) || 0;
    }

    private nowTime(): string {
        const d = new Date();
        const pad = (n: number) => (n <= 9 ? '0' + n : '' + n);
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
}
