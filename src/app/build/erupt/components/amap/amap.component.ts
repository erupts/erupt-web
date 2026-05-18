import {Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, Renderer2, ViewChild} from "@angular/core";
import {LazyService} from "@delon/util";
import {WindowModel} from "@shared/model/window.model";
import {MapType} from "../../model/erupt-field.model";
import {NzMessageService} from "ng-zorro-antd/message";

declare const AMap;

@Component({
    standalone: false,
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
        if (!WindowModel.amapSecurityJsCode) {
            this.msg.error("not config amapSecurityJsCode")
            return;
        }
        if (!WindowModel.amapKey) {
            this.msg.error("not config amapKey")
            return;
        }
        window["_AMapSecurityConfig"] = {
            securityJsCode: WindowModel.amapSecurityJsCode,
        }
        this.lazy.loadScript("https://webapi.amap.com/maps?v=2.0&key=" + WindowModel.amapKey).then(() => {
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
            let autoComplete;
            let placeSearch;
            AMap.plugin([
                'AMap.ToolBar',
                'AMap.Scale',
                'AMap.HawkEye',
                'AMap.MapType',
                'AMap.Geolocation',
                'AMap.PlaceSearch',
                'AMap.AutoComplete',
                'AMap.Geocoder'
            ], function () {
                map.addControl(new AMap.ToolBar());
                map.addControl(new AMap.Scale());
                map.addControl(new AMap.HawkEye({isOpen: true}));
                map.addControl(new AMap.MapType());
                map.addControl(new AMap.Geolocation({}));
                autoComplete = new AMap.Autocomplete({
                    city: ''
                });
                placeSearch = new AMap.PlaceSearch({
                    pageSize: 12,
                    children: 0,
                    pageIndex: 1,
                    extensions: 'base'
                });
                let geocoder = new AMap.Geocoder();

                map.on('click', (e) => {
                    if (!that.pointSelectMode || that.readonly) return;
                    const lnglat = e.lnglat;
                    if (that.currentMarker) {
                        map.remove(that.currentMarker);
                    }
                    that.currentMarker = new AMap.Marker({map: map, position: lnglat});
                    map.setZoomAndCenter(15, lnglat);
                    geocoder.getAddress(lnglat, (status, result) => {
                        const lng = lnglat.getLng();
                        const lat = lnglat.getLat();
                        let address = `${lng},${lat}`;
                        if (status === 'complete' && result.info === 'OK') {
                            address = result.regeocode.formattedAddress;
                        }
                        that.value = {lng, lat, name: address, address};
                        that.viewValue = address;
                        that.valueChange.emit(JSON.stringify(that.value));
                        infoWindow.setContent(`<b>${address}</b><br>经度：${lng}<br>纬度：${lat}`);
                        infoWindow.open(map, lnglat);
                    });
                });
            });
            let that = this;
            this.tipInput.nativeElement.oninput = function () {
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
                    } else {
                        // that.msg.warning(result)
                    }
                });
            };

            document.getElementById("mapOk").onclick = () => {
                if (!this.value && this.autocompleteList.length > 0) {
                    this.value = this.autocompleteList[0];
                    this.viewValue = this.value.name;
                }
                if (this.value) {
                    if (typeof (this.value) == 'string') {
                        this.value = JSON.parse(this.value);
                    }
                    if (this.value["id"]) {
                        getDetails(this.value["id"]);
                    } else if (this.value["lng"] != null && this.value["lat"] != null) {
                        this.valueChange.emit(JSON.stringify(this.value));
                    } else {
                        this.msg.warning("请选择有效的地址");
                    }
                } else {
                    this.msg.warning("请先选择地址");
                }
            };

            let infoWindow = new AMap.InfoWindow({
                autoMove: true,
                offset: {x: 0, y: -30}
            });

            if (this.value) {
                if (this.value.id) {
                    getDetails(this.value.id);
                } else if (this.value.lng != null && this.value.lat != null) {
                    const lnglat = [this.value.lng, this.value.lat];
                    if (that.currentMarker) {
                        map.remove(that.currentMarker);
                    }
                    that.currentMarker = new AMap.Marker({map: map, position: lnglat});
                    map.setZoomAndCenter(15, lnglat);
                    const label = this.value.name || this.value.address || `${this.value.lng},${this.value.lat}`;
                    infoWindow.setContent(`<b>${label}</b><br>经度：${this.value.lng}<br>纬度：${this.value.lat}`);
                    infoWindow.open(map, lnglat);
                }
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
                if (that.currentMarker) {
                    map.remove(that.currentMarker);
                }
                that.currentMarker = new AMap.Marker({
                    map: map,
                    position: poiArr[0].location
                });
                map.setCenter(that.currentMarker.getPosition());
                infoWindow.setContent(createContent(poiArr[0]));
                infoWindow.open(map, that.currentMarker.getPosition());
            }

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

        if (typeof this.value !== 'object') {
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
        if (this.currentMarker) {
            this.map.remove(this.currentMarker);
            this.currentMarker = null;
        }
        this.valueChange.emit(null);
    }

    pointSelectMode: boolean = false;

    currentMarker: any = null;

    togglePointSelect() {
        this.pointSelectMode = !this.pointSelectMode;
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
