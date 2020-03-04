import {Component, ElementRef, OnInit} from "@angular/core";
import {LazyService} from "@delon/util";
import {WindowModel} from "@shared/model/window.model";

declare const AMap;

@Component({
    selector: "gaode-map",
    templateUrl: "./amap.component.html",
    styles: []
})
export class AmapComponent implements OnInit {

    loading: boolean;

    constructor(private lazy: LazyService, private ref: ElementRef) {
    }

    ngOnInit() {
        this.loading = true;
        this.lazy.loadScript("https://webapi.amap.com/maps?v=1.4.14&key=" + WindowModel.amapKey).then(() => {
            this.loading = false;
            let map = new AMap.Map(this.ref.nativeElement.querySelector("#amap"), {
                zoom: 11,
                resizeEnable: true,
                viewMode: '3D'
            });
            AMap.plugin('AMap.Geolocation', function () {
                let geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,//是否使用高精度定位，默认:true
                    timeout: 10000,          //超过10秒后停止定位，默认：5s
                    buttonPosition: 'RB',    //定位按钮的停靠位置
                    autoFitView: true
                });
                map.addControl(geolocation);
            });
            AMap.plugin(['AMap.ControlBar',], function () {
                // 添加 3D 罗盘控制
                map.addControl(new AMap.ControlBar());
            });
            AMap.service(["AMap.PlaceSearch"], function () {
                //构造地点查询类
                let placeSearch = new AMap.PlaceSearch({
                    pageSize: 5, // 单页显示结果条数
                    pageIndex: 1, // 页码
                    map: map, // 展现结果的地图实例
                    panel: "panel", // 结果列表将在此容器中进行展示。
                    autoFitView: true // 是否自动调整地图视野使绘制的 Marker点都处于视口的可见范围
                });
                //关键字查询
                placeSearch.search('公园', function (status, result) {
                    console.log(result);
                });
            });
        });
    }

}
