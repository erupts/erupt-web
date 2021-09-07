import {Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, Renderer2, ViewChild} from "@angular/core";
import {LazyService} from "@delon/util";
import {WindowModel} from "@shared/model/window.model";
import {NzMessageService} from "ng-zorro-antd";
import {isObject} from "util";
import {MapType} from "../../model/erupt-field.model";

declare const AMap;

@Component({
    selector: "amap",
    templateUrl: "./amap.component.html",
    styleUrls: ["./amap.component.less"]
})
export class AmapComponent implements OnInit {

    loading: boolean;

    @Input() value: any;

    @Output() valueChange = new EventEmitter();

    @Input() zoom: number = 11;

    @Input() readonly: boolean = false;

    @Input() mapType: MapType;


    @ViewChild('tipInput', {
        static: true
    }) tipInput;

    viewValue: any = "";

    loaded: boolean = false;

    autocompleteList: any[] = [];

    constructor(private lazy: LazyService,
                private ref: ElementRef,
                private renderer: Renderer2,
                @Inject(NzMessageService)
                private msg: NzMessageService) {
    }

    map: any;

    mouseTool: any;

    ngOnInit() {
        this.loading = true;
        this.lazy.loadScript("https://webapi.amap.com/maps?v=1.4.15&key=" +
            WindowModel.amapKey + "&plugin=AMap.Autocomplete&&plugin=AMap.PlaceSearch&plugin=AMap.MouseTool").then(() => {
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
            this.map = map;
            this.mouseTool = new AMap.MouseTool(map);
            AMap.plugin('AMap.Geolocation', function () {
                let geolocation = new AMap.Geolocation({
                    timeout: 10000,          //超过10秒后停止定位，默认：5s
                    buttonPosition: 'RB',    //定位按钮的停靠位置
                    autoFitView: true
                });
                map.addControl(geolocation);
            });
            AMap.plugin(['AMap.ControlBar'], function () {
                // 添加 3D 罗盘控制
                map.addControl(new AMap.ControlBar());
            });
            let that = this;

            function complete() {
                AMap.plugin('AMap.Autocomplete', function () {
                    let autoComplete = new AMap.Autocomplete({
                        city: ''
                    });
                    autoComplete.search(that.tipInput.nativeElement.value, function (status, result) {
                        if (status == "complete") {
                            let tips = [];
                            if (result.tips) {
                                result.tips.forEach(it => {
                                    if (it.id) {
                                        tips.push(it);
                                    }
                                });
                            }
                            that.autocompleteList = tips;
                        }
                    });
                });
            }

            this.tipInput.nativeElement.oninput = complete;

            let placeSearch = new AMap.PlaceSearch({
                pageSize: 12, // 单页显示结果条数
                children: 0, //不展示子节点数据
                pageIndex: 1, //页码
                extensions: 'base' //返回基本地址信息
            });

            document.getElementById("mapOk").onclick = () => {
                if (!this.value && this.autocompleteList.length > 0) {
                    this.value = this.autocompleteList[0];
                    this.viewValue = this.value.name;
                }
                if (this.value) {
                    if (typeof (this.value) == 'string') {
                        this.value = JSON.parse(this.value);
                    }
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
                        placeSearchCallBack(result);
                        that.valueChange.emit(JSON.stringify(that.value));
                    } else {
                        that.msg.warning("找不到该位置信息");
                    }
                });
            }

            //回调函数
            function placeSearchCallBack(data) {
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
                s.push("经度：" + poi.location.lng);
                s.push("纬度：" + poi.location.lat);
                return s.join("<br>");
            }
        });
    }

    blur() {
        if (!this.value) {
            this.viewValue = null;
            return;
        }
        if (!isObject(this.value)) {
            this.value = JSON.parse(this.value);
        }
        if (this.value.name != this.tipInput.nativeElement.value) {
            this.value = null;
            this.viewValue = null;
        }
    }

    choiceList(auto: any) {
        this.value = auto;
        this.viewValue = auto.name;
    }

    clearLocation() {
        this.value = null;
        this.viewValue = null;
        this.valueChange.emit(null);
    }

    checkType: string;

    overlays: any[];

    draw(type) {
        //监听draw事件可获取画好的覆盖物
        this.overlays = [];
        this.mouseTool.on('draw', (e) => {
            this.overlays.push(e.obj);
        });
        drawFun.call(this, type);

        function drawFun(type) {
            let fillColor = "#00b0ff";
            let strokeColor = "#80d8ff";
            switch (type) {
                case 'marker': {
                    this.mouseTool.marker({
                        //同Marker的Option设置
                    });
                    break;
                }
                case 'polyline': {
                    this.mouseTool.polyline({
                        strokeColor: strokeColor
                        //同Polyline的Option设置
                    });
                    break;
                }
                case 'polygon': {
                    this.mouseTool.polygon({
                        fillColor: fillColor,
                        strokeColor: strokeColor
                        //同Polygon的Option设置
                    });
                    break;
                }
                case 'rectangle': {
                    this.mouseTool.rectangle({
                        fillColor: fillColor,
                        strokeColor: strokeColor
                        //同Polygon的Option设置
                    });
                    break;
                }
                case 'circle': {
                    this.mouseTool.circle({
                        fillColor: fillColor,
                        strokeColor: strokeColor
                        //同Circle的Option设置
                    });
                    break;
                }
            }
        }
    }

    clearDraw() {
        this.map.remove(this.overlays);
    }

    closeDraw() {
        this.mouseTool.close(true); //关闭，并清除覆盖物
        this.checkType = '';
    }


}
