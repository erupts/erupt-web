import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
    Rose, Line, Area, StepLine, Ring, Radar,
    StackArea, WordCloud, Funnel, Pie, Column, StackColumn
} from '@antv/g2plot';
import {Chart, ChartType} from "../model/bi.model";
import {BiDataService} from "../service/data.service";
import BasePlot from "@antv/g2plot/lib/base/plot";

@Component({
    selector: 'bi-chart',
    templateUrl: "./chart.component.html",
    styles: []
})
export class ChartComponent implements OnInit, OnDestroy {

    @Input() chart: Chart;

    @Input() biCode: string;

    private plot: BasePlot;

    constructor(private ref: ElementRef, private biDataService: BiDataService) {
    }

    ngOnInit() {
        this.chart.loading = true;
        this.biDataService.getBiChart(this.biCode, this.chart.code, {}).subscribe(data => {
            this.chart.loading = false;
            let element = this.ref.nativeElement.querySelector("#" + this.chart.code);
            this.render(element, data);
        });
    }

    ngOnDestroy(): void {
        this.plot && this.plot.destroy();
    }

    update() {
        this.chart.loading = true;
        this.biDataService.getBiChart(this.biCode, this.chart.code, {}).subscribe(data => {
            this.chart.loading = false;
            this.plot.changeData(data);
        });
    }

    render(element, data: any[]) {
        if (this.plot) {
            this.plot.destroy();
            this.plot = null;
        }
        let keys = Object.keys(data[0]);
        let x = keys[0];
        let y = keys[1];
        let series = keys[2];
        let props = {
            data: data,
            xField: x,
            yField: y,
            // theme: 'dark',
        };
        if (this.chart.chartOption) {
            Object.assign(props, JSON.parse(this.chart.chartOption));
        }
        switch (this.chart.type) {
            case ChartType.Line:
                this.plot = new Line(element, Object.assign(props, {
                    seriesField: series,
                }));
                break;
            case ChartType.StepLine:
                this.plot = new StepLine(element, Object.assign(props, {
                    seriesField: series,
                }));
                break;
            case ChartType.Column:
                if (series) {
                    this.plot = new StackColumn(element, Object.assign(props, {
                        stackField: series
                    }));
                } else {
                    this.plot = new Column(element, Object.assign(props, {}));
                }
                break;
            case ChartType.Area:
                if (series) {
                    this.plot = new StackArea(element, Object.assign(props, {
                        stackField: series
                    }));
                } else {
                    this.plot = new Area(element, Object.assign(props, {}));
                }
                break;

            //饼
            case ChartType.Pie:
                this.plot = new Pie(element, Object.assign(props, {
                    angleField: y,
                    colorField: x,
                }));
                break;
            case ChartType.Ring:
                this.plot = new Ring(element, Object.assign(props, {
                    angleField: y,
                    colorField: x,
                }));
                break;

            case ChartType.Rose:
                this.plot = new Rose(element, Object.assign(props, {
                    radiusField: y,
                    categoryField: x,
                    colorField: x,
                    stackField: series,
                }));
                break;
            case ChartType.Funnel:
                this.plot = new Funnel(element, Object.assign(props, {
                    transpose: true
                }));
                break;
            case ChartType.Radar:
                this.plot = new Radar(element, Object.assign(props, {
                    angleField: x,
                    radiusField: y,
                    seriesField: series,
                    line: {
                        visible: true,
                    },
                    point: {
                        visible: true,
                        shape: 'circle',
                    },
                }));
                break;
            case ChartType.WordCloud:
                const list = [];
                // change data type
                data.forEach((d) => {
                    list.push({
                        word: d[x],
                        weight: d[y],
                        id: data.length,
                    });
                });
                const arr = ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E8684A',
                    '#6DC8EC', '#9270CA', '#FF9D4D', '#269A99', '#FF99C3',];
                this.plot = new WordCloud(element, Object.assign(props, {
                    data: list,
                    wordStyle: {
                        fontSize: [20, 100],
                        color: (word, weight) => {
                            return arr[Math.floor(Math.random() * (arr.length - 1))];
                        },
                    },
                }));
                break;
            case ChartType.Heatmap:
                break;
            case ChartType.Scatter:
                break;

        }
        setTimeout(() => {
            this.plot && this.plot.render();
        }, 200);
    }

}
