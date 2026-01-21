import {
    Area,
    Bar,
    Chord,
    Column,
    Funnel,
    Gauge,
    Line,
    Pie,
    Progress,
    Radar,
    RadialBar,
    RingProgress,
    Rose,
    Sankey,
    Scatter,
    TinyArea,
    TinyColumn,
    TinyLine,
    Waterfall,
    WordCloud
} from "@antv/g2plot";
import {CubeKey, ReportDSL, ReportType} from "../model/dashboard.model";
import {ElementRef} from "@angular/core";
import {WindowModel} from "@shared/model/window.model";

export function renderChart(chartContainer: ElementRef, reportDSL: ReportDSL, data: Record<string, any>[]): any {
    const commonConfig: any = {
        data: data,
        ...reportDSL.cube,
        ...reportDSL.ui,
    };
    if(WindowModel.theme.primaryColor){
        // commonConfig.color = WindowModel.theme.primaryColor
    }
    if (reportDSL.ui["legendPosition"]) {
        commonConfig["legend"] = {
            layout: 'horizontal',
            position: reportDSL.ui["legendPosition"],
        };
    }
    if (reportDSL.ui["showLabel"]) {
        commonConfig["label"] = {
            position: reportDSL.type === ReportType.PIE ? 'outer' : 'middle',
        };
    }
    if (reportDSL.ui["showSlider"]) {
        commonConfig["slider"] = {};
    }
    if (reportDSL.ui["showScrollbar"]) {
        commonConfig["scrollbar"] = {};
    }
    if (reportDSL.ui["showXAxis"] === false) {
        commonConfig["xAxis"] = false;
    }
    if (reportDSL.ui["showYAxis"] === false) {
        commonConfig["yAxis"] = false;
    }
    if (reportDSL.ui["showTooltip"] === false) {
        commonConfig["tooltip"] = false;
    }
    if (reportDSL.ui["theme"]) {
        commonConfig["theme"] = reportDSL.ui["theme"];
    }
    if (reportDSL.ui["color"] && reportDSL.ui["color"].length > 0) {
        commonConfig["color"] = reportDSL.ui["color"];
    }
    let chart: any = null;
    switch (reportDSL.type) {
        case ReportType.LINE:
            chart = new Line(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
                seriesField: reportDSL.cube[CubeKey.seriesField] as string,
                stepType: reportDSL.ui["stepType"] ? 'hv' : undefined,
            });
            break;
        case ReportType.AREA:
            chart = new Area(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
                seriesField: reportDSL.cube[CubeKey.seriesField] as string,
            });
            break;
        case ReportType.COLUMN:
            chart = new Column(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
                seriesField: reportDSL.cube[CubeKey.seriesField] as string,
            });
            break;
        case ReportType.BAR:
            chart = new Bar(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
                seriesField: reportDSL.cube[CubeKey.seriesField] as string,
            });
            break;
        case ReportType.PIE:
            chart = new Pie(chartContainer.nativeElement, {
                ...commonConfig,
                angleField: reportDSL.cube[CubeKey.yField] as string,
                colorField: reportDSL.cube[CubeKey.xField] as string,
                radius: reportDSL.ui["innerRadius"] ? 1 : 0.8,
                innerRadius: reportDSL.ui["innerRadius"] || 0,
                label: reportDSL.ui["showLabel"] ? {type: 'outer'} : false
            });
            break;
        case ReportType.SCATTER:
            chart = new Scatter(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
                colorField: reportDSL.cube[CubeKey.seriesField] as string,
            });
            break;
        case ReportType.RADAR:
            chart = new Radar(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
                seriesField: reportDSL.cube[CubeKey.seriesField] as string,
            });
            break;
        case ReportType.FUNNEL:
            chart = new Funnel(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
            });
            break;
        case ReportType.GAUGE:
            chart = new Gauge(chartContainer.nativeElement, {
                ...commonConfig,
                percent: (data && data.length > 0) ? (data[0][reportDSL.cube[CubeKey.yField] as string] || data[0][CubeKey.yField] || 0) / 100 : 0,
                range: {
                    color: 'l(0) 0:#B8E1FF 1:#3D76DD',
                },
                startAngle: Math.PI,
                endAngle: 2 * Math.PI,
                indicator: {
                    pointer: {
                        style: {
                            stroke: '#D0D0D0',
                        },
                    },
                    pin: {
                        style: {
                            stroke: '#D0D0D0',
                        },
                    },
                },
                axis: {
                    label: {
                        formatter(v) {
                            return Number(v) * 100;
                        },
                    },
                    subTickLine: {
                        count: 3,
                    },
                },
                statistic: {
                    content: {
                        formatter: ({percent}) => `Rate: ${(percent * 100).toFixed(0)}%`,
                        style: {
                            color: 'rgba(0,0,0,0.65)',
                            fontSize: '24px',
                        },
                    },
                },
            });
            break;
        case ReportType.WATERFALL:
            chart = new Waterfall(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
            });
            break;
        case ReportType.WORD_CLOUD:
            chart = new WordCloud(chartContainer.nativeElement, {
                ...commonConfig,
                wordField: reportDSL.cube[CubeKey.xField] as string,
                weightField: reportDSL.cube[CubeKey.yField] as string,
                colorField: reportDSL.cube[CubeKey.xField] as string,
                wordStyle: {
                    fontFamily: 'Verdana',
                    fontSize: [24, 80],
                },
            });
            break;
        case ReportType.ROSE:
            chart = new Rose(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
                seriesField: reportDSL.cube[CubeKey.seriesField] as string,
                radius: 0.9,
            });
            break;
        case ReportType.RADIAL_BAR:
            chart = new RadialBar(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
                maxAngle: 270,
            });
            break;
        case ReportType.SANKEY:
            chart = new Sankey(chartContainer.nativeElement, {
                ...commonConfig,
                sourceField: reportDSL.cube[CubeKey.sourceField] as string || 'source',
                targetField: reportDSL.cube[CubeKey.targetField] as string || 'target',
                weightField: reportDSL.cube[CubeKey.weightField] as string || 'value',
            });
            break;
        case ReportType.CHORD:
            chart = new Chord(chartContainer.nativeElement, {
                ...commonConfig,
                sourceField: reportDSL.cube[CubeKey.sourceField] as string || 'source',
                targetField: reportDSL.cube[CubeKey.targetField] as string || 'target',
                weightField: reportDSL.cube[CubeKey.weightField] as string || 'value',
            });
            break;
        case ReportType.BUBBLE:
            chart = new Scatter(chartContainer.nativeElement, {
                ...commonConfig,
                xField: reportDSL.cube[CubeKey.xField] as string,
                yField: reportDSL.cube[CubeKey.yField] as string,
                sizeField: reportDSL.cube['sizeField'] as string || reportDSL.cube[CubeKey.yField] as string,
                size: [4, 30],
                shape: 'circle',
                pointStyle: {
                    fillOpacity: 0.8,
                    stroke: '#bbb',
                },
            });
            break;
        case ReportType.TINY_LINE:
            chart = new TinyLine(chartContainer.nativeElement, {
                ...commonConfig,
                data: data.map(item => item[reportDSL.cube[CubeKey.yField] as string]),
            });
            break;
        case ReportType.TINY_AREA:
            chart = new TinyArea(chartContainer.nativeElement, {
                ...commonConfig,
                data: data.map(item => item[reportDSL.cube[CubeKey.yField] as string]),
            });
            break;
        case ReportType.TINY_COLUMN:
            chart = new TinyColumn(chartContainer.nativeElement, {
                ...commonConfig,
                data: data.map(item => item[reportDSL.cube[CubeKey.yField] as string]),
            });
            break;
        case ReportType.PROGRESS:
            chart = new Progress(chartContainer.nativeElement, {
                ...commonConfig,
                percent: (data && data.length > 0) ? (data[0][reportDSL.cube[CubeKey.yField] as string] || data[0][CubeKey.yField] || 0) / 100 : 0,
                color: reportDSL.ui["color"] || ['#5B8FF9', '#E8EDF3'],
            });
            break;
        case ReportType.RING_PROGRESS:
            chart = new RingProgress(chartContainer.nativeElement, {
                ...commonConfig,
                percent: (data && data.length > 0) ? (data[0][reportDSL.cube[CubeKey.yField] as string] || data[0][CubeKey.yField] || 0) / 100 : 0,
                color: reportDSL.ui["color"] || ['#5B8FF9', '#E8EDF3'],
                innerRadius: reportDSL.ui["innerRadius"] || 0.8,
                radius: 0.98,
            });
            break;
    }
    chart.render();
    return chart;
}
