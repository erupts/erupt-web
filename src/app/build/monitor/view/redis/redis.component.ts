import {AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild} from '@angular/core';
import {NzModalService} from 'ng-zorro-antd/modal';
import {I18NService} from '@core';
import {MonitorService} from '../../service/monitor.service';
import {RedisInfo} from '../../model/monitor.model';

@Component({
    standalone: false,
    selector: 'app-monitor-redis',
    templateUrl: './redis.component.html',
    styleUrls: ['./redis.component.less', '../../monitor.shared.less']
})
export class RedisComponent implements AfterViewInit, OnDestroy {

    loading: boolean = true;
    refreshing: boolean = false;
    autoRefresh: boolean = true;
    isFullscreen: boolean = false;
    lastUpdate: string = '';
    selectedCmd: { name: string; value: string; percent: string } | null = null;

    redis: RedisInfo = {redisCmdStat: []} as any;

    @ViewChild('commandPie', {static: false}) commandPieRef: ElementRef<HTMLDivElement>;
    @ViewChild('keyLine', {static: false}) keyLineRef: ElementRef<HTMLDivElement>;

    private commandPie: any;
    private keyLine: any;
    private keySizeArr: number[] = [];
    private xAxisData: string[] = [];
    private timer: any;
    private failed: boolean = false;
    private resize = () => {
        this.commandPie?.resize();
        this.keyLine?.resize();
    };
    private onFullscreen = () => {
        this.zone.run(() => { this.isFullscreen = !!document.fullscreenElement; });
        setTimeout(() => { this.commandPie?.resize(); this.keyLine?.resize(); }, 200);
    };
    private onVisible = () => {
        if (document.hidden) {
            this.stopTimer();
        } else if (this.autoRefresh && !this.failed) {
            this.startTimer();
        }
    };

    constructor(private monitorService: MonitorService,
                private modal: NzModalService,
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
        this.commandPie?.dispose();
        this.keyLine?.dispose();
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

    fragRatioColor(): string {
        const v = parseFloat(this.redis.fragRatio);
        if (isNaN(v)) return 'default';
        if (v > 2) return 'red';
        if (v >= 1.5) return 'orange';
        return 'green';
    }

    clearCmdSelection(): void {
        this.selectedCmd = null;
        this.commandPie?.dispatchAction({type: 'unselect', seriesIndex: 0});
    }

    toggleAuto(on: boolean): void {
        this.autoRefresh = on;
        on ? this.startTimer() : this.stopTimer();
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
        this.monitorService.redisInfo().subscribe({
            next: data => {
                this.redis = data;
                this.loading = false;
                this.refreshing = false;
                this.lastUpdate = this.nowTime();
                this.updateCharts(data);
            },
            error: () => {
                this.refreshing = false;
                this.loading = false;
                if (!this.failed) {
                    this.failed = true;
                    this.stopTimer();
                    this.modal.warning({
                        nzTitle: this.i18n.fanyi('monitor.tip'),
                        nzContent: this.i18n.fanyi('monitor.redis.connect_failed'),
                        nzOkText: this.i18n.fanyi('global.ok')
                    });
                }
            }
        });
    }

    private initCharts(echarts: any): void {
        this.commandPie = echarts.init(this.commandPieRef.nativeElement);
        this.commandPie.setOption({
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
                selectedMode: 'single',
                emphasis: {
                    label: {show: true, fontSize: 14, fontWeight: 'bold'},
                    itemStyle: {shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.3)'}
                }
            }]
        });
        this.commandPie.on('click', (params: any) => {
            this.zone.run(() => {
                this.selectedCmd = {
                    name: params.name,
                    value: params.value,
                    percent: (params.percent || 0).toFixed(1)
                };
            });
        });

        this.keyLine = echarts.init(this.keyLineRef.nativeElement);
        this.keyLine.setOption({
            color: ['#1890ff'],
            grid: {left: 48, right: 24, top: 24, bottom: 32},
            xAxis: {type: 'category', boundaryGap: false, data: []},
            yAxis: {type: 'value', minInterval: 1},
            tooltip: {trigger: 'axis', axisPointer: {type: 'cross', label: {backgroundColor: '#6a7985'}}},
            series: [{
                data: [],
                name: this.i18n.fanyi('monitor.redis.key_count_series'),
                type: 'line',
                smooth: true,
                showSymbol: false,
                areaStyle: {opacity: 0.15}
            }]
        });
    }

    private updateCharts(data: RedisInfo): void {
        if (!this.commandPie || !this.keyLine) {
            return;
        }
        this.commandPie.setOption({series: [{data: data.redisCmdStat}]});

        this.keySizeArr.push(data.keyNum);
        this.xAxisData.push(this.lastUpdate);
        if (this.keySizeArr.length > 60) {
            this.keySizeArr.shift();
            this.xAxisData.shift();
        }
        this.keyLine.setOption({
            xAxis: {data: this.xAxisData},
            series: [{data: this.keySizeArr}]
        });
    }

    private nowTime(): string {
        const d = new Date();
        const pad = (n: number) => (n <= 9 ? '0' + n : '' + n);
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
}
