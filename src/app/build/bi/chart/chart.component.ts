import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {
    Rose, Line, Area, StepLine, Ring, Radar,
    StackArea, WordCloud, Funnel, Pie, Column, StackColumn
} from '@antv/g2plot';
import {Chart, ChartType} from "../model/bi.model";
import {BiDataService} from "../service/data.service";

@Component({
    selector: 'bi-chart',
    templateUrl: "./chart.component.html",
    styles: []
})
export class ChartComponent implements OnInit {

    @Input() chart: Chart;

    @Input() biCode: string;

    loading: boolean = false;

    constructor(private ref: ElementRef, private biDataService: BiDataService) {
    }

    ngOnInit() {
        this.query()

    }

    query() {
        let element = this.ref.nativeElement.querySelector(".plot");
        this.loading = true;
        this.biDataService.getBiChart(this.biCode, this.chart.code, {}).subscribe(data => {
            this.loading = false;
            setTimeout(() => {
                this.render(element, data)
            }, 200);
        })
    }

    render(element, data: any[]) {
        let plot;
        let keys = Object.keys(data[0]);
        let x = keys[0];
        let y = keys[1];
        let series = keys[2];
        let props = {
            data: data,
            xField: x,
            yField: y,
        };
        switch (this.chart.type) {
            case ChartType.Line:
                plot = new Line(element, Object.assign(props, {
                    seriesField: series,
                }));
                break;
            case ChartType.StepLine:
                plot = new StepLine(element, Object.assign(props, {
                    seriesField: series,
                }));
                break;
            case ChartType.Column:
                if (series) {
                    plot = new StackColumn(element, Object.assign(props, {
                        stackField: series
                    }));
                } else {
                    plot = new Column(element, Object.assign(props, {}));
                }
                break;
            case ChartType.Area:
                if (series) {
                    plot = new StackArea(element, Object.assign(props, {
                        stackField: series
                    }));
                } else {
                    plot = new Area(element, Object.assign(props, {}));
                }
                break;

            //饼
            case ChartType.Pie:
                plot = new Pie(element, Object.assign(props, {
                    angleField: y,
                    colorField: x,
                }));
                break;
            case ChartType.Ring:
                plot = new Ring(element, Object.assign(props, {
                    angleField: y,
                    colorField: x,
                }));
                break;

            case ChartType.Rose:
                plot = new Rose(element, Object.assign(props, {
                    radiusField: y,
                    categoryField: x,
                    colorField: x,
                    stackField: series,
                }));
                break;
            case ChartType.Funnel:
                plot = new Funnel(element, Object.assign(props, {
                    transpose: true
                }));
                break;
            case ChartType.Radar:
                plot = new Radar(element, Object.assign(props, {
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
                plot = new WordCloud(element, Object.assign(props, {
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
        plot && plot.render();
    }

}
