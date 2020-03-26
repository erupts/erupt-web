import {Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output} from "@angular/core";
import {LazyService} from "@delon/util";
import {WindowModel} from "@shared/model/window.model";
import {NzMessageService} from "ng-zorro-antd";

declare const AMap;

@Component({
    selector: "amap",
    templateUrl: "./amap.component.html",
    styles: []
})
export class AmapComponent implements OnInit {

    loading: boolean;

    @Input() value: any;

    @Output() valueChange = new EventEmitter();

    @Input() zoom: number = 11;

    @Input() readonly: boolean = false;

    viewValue: any = "";

    loaded: boolean = false;

    autocompleteList: any[] = [];

    constructor(private lazy: LazyService, private ref: ElementRef,
                @Inject(NzMessageService)
                private msg: NzMessageService,) {
    }

    ngOnInit() {
        this.loading = true;
        this.lazy.loadScript("https://webapi.amap.com/maps?v=1.4.15&key=" +
            WindowModel.amapKey + "&plugin=AMap.Autocomplete&&plugin=AMap.PlaceSearch").then(() => {
            if (this.value) {
                this.value = JSON.parse(this.value);
                this.autocompleteList = [this.value];
                this.choiceList(this.value);
            }
            this.loading = false;
            let map = new AMap.Map(this.ref.nativeElement.querySelector("#amap"), {
                zoom: this.zoom,
                resizeEnable: true,
                viewMode: '3D'
            });
            map.on("complete", () => {
                this.loaded = true;
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
            let that = this;

            function complete() {
                AMap.plugin('AMap.Autocomplete', function () {
                    let autoComplete = new AMap.Autocomplete({
                        city: '全国'
                    });
                    autoComplete.search((<HTMLInputElement>document.getElementById("tipInput")).value, function (status, result) {
                        if (status == "complete") {
                            that.autocompleteList = result.tips;
                        }
                    })
                })
            }

            document.getElementById("tipInput").oninput = complete;

            let placeSearch = new AMap.PlaceSearch({
                pageSize: 10, // 单页显示结果条数
                children: 0, //不展示子节点数据
                pageIndex: 1, //页码
                extensions: 'base' //返回基本地址信息
            });

            document.getElementById("mapOk").onclick = () => {
                if (this.value) {
                    if (!this.value["id"]) {
                        this.msg.warning("请选择有效的地址");
                        return;
                    }
                    getDetails(this.value["id"]);
                } else {
                    this.msg.warning("请先选择地址");
                }
            };

            if (this.value) {
                getDetails(this.value.id);
            }

            //详情查询
            function getDetails(id) {
                placeSearch.getDetails(id, (status, result) => {
                    if (status === 'complete' && result.info === 'OK') {
                        placeSearch_CallBack(result);
                        that.valueChange.emit(JSON.stringify(that.value));
                    }
                });
            }

            //回调函数
            function placeSearch_CallBack(data) {
                let poiArr = data.poiList.pois;
                //添加marker
                let marker = new AMap.Marker({
                    map: map,
                    position: poiArr[0].location
                });
                map.setCenter(marker.getPosition());
                infoWindow.setContent(createContent(poiArr[0]));
                infoWindow.open(map, marker.getPosition());
            }

            let infoWindow = new AMap.InfoWindow({
                autoMove: true,
                offset: {x: 0, y: -30}
            });

            function createContent(poi) {  //信息窗体内容
                let s = [];
                s.push("<b>名称：" + poi.name + "</b>");
                s.push("地址：" + poi.address);
                s.push("电话：" + poi.tel);
                s.push("类型：" + poi.type);
                return s.join("<br>");
            }
        });
    }

    choiceList(auto: any) {
        this.value = auto;
        this.viewValue = auto.name;
    }

}