import {AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild} from '@angular/core';
import {I18NService} from '@core';
import {MonitorService} from '../../service/monitor.service';
import {DataSourcePool, HttpStat, JvmDiagnosis} from '../../model/monitor.model';

@Component({
    standalone: false,
    selector: 'app-monitor-diagnosis',
    templateUrl: './diagnosis.component.html',
    styleUrls: ['./diagnosis.component.less', '../../monitor.shared.less']
})
export class DiagnosisComponent implements AfterViewInit, OnDestroy {

    loading: boolean = true;
    refreshing: boolean = false;
    autoRefresh: boolean = true;
    isFullscreen: boolean = false;
    dumping: boolean = false;
    resetting: boolean = false;
    lastUpdate: string = '';
    httpSortBy: string = 'avg';

    jvm: JvmDiagnosis = {gc: [], memoryPools: [], classLoading: {} as any, threads: {states: {}} as any} as JvmDiagnosis;
    pools: DataSourcePool[] = [];
    httpStats: HttpStat[] = [];
    poolHistory: { [name: string]: number[] } = {};

    @ViewChild('poolChart', {static: false}) poolRef: ElementRef<HTMLDivElement>;
    @ViewChild('threadChart', {static: false}) threadRef: ElementRef<HTMLDivElement>;

    private poolChart: any;
    private threadChart: any;
    private timer: any;
    private resize = () => {
        this.poolChart?.resize();
        this.threadChart?.resize();
    };
    private onFullscreen = () => {
        this.zone.run(() => { this.isFullscreen = !!document.fullscreenElement; });
        setTimeout(() => { this.poolChart?.resize(); this.threadChart?.resize(); }, 200);
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
                private zone: NgZone,
                private el: ElementRef) {
    }

    async ngAfterViewInit(): Promise<void> {
        const echarts = await import('echarts');
        this.zone.runOutsideAngular(() => {
            this.initCharts(echarts);
            window.addEventListener('resize', this.resize);
        });
        this.load();
        if (this.autoRefresh) {
            this.startTimer();
        }
        document.addEventListener('visibilitychange', this.onVisible);
        document.addEventListener('fullscreenchange', this.onFullscreen);
    }

    ngOnDestroy(): void {
        this.stopTimer();
        window.removeEventListener('resize', this.resize);
        document.removeEventListener('visibilitychange', this.onVisible);
        document.removeEventListener('fullscreenchange', this.onFullscreen);
        this.poolChart?.dispose();
        this.threadChart?.dispose();
    }

    refresh(): void {
        this.refreshing = true;
        this.load();
    }

    toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            this.el.nativeElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }

    toggleAuto(on: boolean): void {
        this.autoRefresh = on;
        on ? this.startTimer() : this.stopTimer();
    }

    threadDump(): void {
        this.dumping = true;
        this.monitorService.threadDump(() => this.dumping = false);
    }

    resetHttpStats(): void {
        this.resetting = true;
        this.monitorService.resetHttpStats().subscribe({
            next: () => { this.httpStats = []; this.resetting = false; },
            error: () => this.resetting = false
        });
    }

    sortHttp(sortBy: string): void {
        this.httpSortBy = sortBy;
        this.loadHttpStats();
    }

    errorRate(stat: HttpStat): string {
        return stat.count > 0 ? ((stat.errorCount / stat.count) * 100).toFixed(1) + '%' : '0%';
    }

    usageColor(usage: number | string): string {
        const p = +usage || 0;
        return p >= 90 ? '#ff4d4f' : p >= 70 ? '#faad14' : '#52c41a';
    }

    poolUsage(pool: DataSourcePool): number {
        return pool.max > 0 ? Math.round(pool.active * 100 / pool.max) : 0;
    }

    sparklinePath(name: string): string {
        const data = this.poolHistory[name] || [];
        if (data.length < 2) return '';
        const w = 80, h = 28;
        const max = Math.max(...data, 1);
        return data.map((v, i) => {
            const x = (i / (data.length - 1)) * w;
            const y = h - (v / max) * h;
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
    }

    private startTimer(): void {
        this.stopTimer();
        this.timer = setInterval(() => this.load(), 5000);
    }

    private stopTimer(): void {
        clearInterval(this.timer);
        this.timer = null;
    }

    private load(): void {
        this.monitorService.jvmDiagnosis().subscribe({
            next: data => {
                this.jvm = data;
                this.loading = false;
                this.refreshing = false;
                this.lastUpdate = this.nowTime();
                this.updateCharts(data);
            },
            error: () => {
                this.loading = false;
                this.refreshing = false;
            }
        });
        this.monitorService.datasource().subscribe({
            next: data => {
                this.pools = data || [];
                this.pools.forEach(p => {
                    const hist = this.poolHistory[p.name] || (this.poolHistory[p.name] = []);
                    hist.push(p.active);
                    if (hist.length > 20) hist.shift();
                });
            },
            error: () => this.pools = []
        });
        this.loadHttpStats();
    }

    private loadHttpStats(): void {
        this.monitorService.httpStats(this.httpSortBy).subscribe({
            next: data => this.httpStats = data || [],
            error: () => this.httpStats = []
        });
    }

    private initCharts(echarts: any): void {
        this.poolChart = echarts.init(this.poolRef.nativeElement);
        this.poolChart.setOption({
            tooltip: {trigger: 'axis', axisPointer: {type: 'shadow'}, valueFormatter: (v: number) => this.formatBytes(v)},
            legend: {data: [this.i18n.fanyi('monitor.diagnosis.used'), this.i18n.fanyi('monitor.diagnosis.committed')], top: 0, right: 0},
            grid: {left: 8, right: 16, top: 36, bottom: 8, containLabel: true},
            xAxis: {type: 'value', axisLabel: {formatter: (v: number) => this.formatBytes(v)}},
            yAxis: {type: 'category', data: []},
            series: [
                {name: this.i18n.fanyi('monitor.diagnosis.used'), type: 'bar', color: '#1890ff', data: []},
                {name: this.i18n.fanyi('monitor.diagnosis.committed'), type: 'bar', color: '#bae7ff', data: []}
            ]
        });

        this.threadChart = echarts.init(this.threadRef.nativeElement);
        this.threadChart.setOption({
            tooltip: {trigger: 'item', formatter: '{b}: {c} ({d}%)'},
            legend: {type: 'scroll', bottom: 0, left: 'center'},
            series: [{
                type: 'pie',
                radius: ['40%', '68%'],
                center: ['50%', '46%'],
                avoidLabelOverlap: true,
                itemStyle: {borderColor: '#fff', borderWidth: 2, borderRadius: 4},
                label: {show: false},
                data: [],
                emphasis: {label: {show: true, fontSize: 14, fontWeight: 'bold'}}
            }]
        });
    }

    private updateCharts(data: JvmDiagnosis): void {
        if (this.poolChart && data.memoryPools) {
            const names = data.memoryPools.map(p => p.name);
            this.poolChart.setOption({
                yAxis: {data: names},
                series: [
                    {data: data.memoryPools.map(p => p.used)},
                    {data: data.memoryPools.map(p => p.committed)}
                ]
            });
        }
        if (this.threadChart && data.threads?.states) {
            const states = Object.keys(data.threads.states)
                .filter(k => data.threads.states[k] > 0)
                .map(k => ({name: k, value: data.threads.states[k]}));
            this.threadChart.setOption({series: [{data: states}]});
        }
    }

    private formatBytes(bytes: number): string {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    }

    private nowTime(): string {
        const d = new Date();
        const pad = (n: number) => (n <= 9 ? '0' + n : '' + n);
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
}
