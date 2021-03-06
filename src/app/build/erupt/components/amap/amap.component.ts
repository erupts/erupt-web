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
                'AMap.AutoComplete'
            ], function () {
                // ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
                map.addControl(new AMap.ToolBar());
                // ????????????????????????????????????????????????????????????????????????????????????
                map.addControl(new AMap.Scale());
                // ????????????????????????????????????????????????????????????????????????
                map.addControl(new AMap.HawkEye({isOpen: true}));
                // ????????????????????????????????????????????????????????????????????????????????????????????????????????????
                map.addControl(new AMap.MapType());
                // ???????????????????????????????????????????????????????????????????????????????????????
                map.addControl(new AMap.Geolocation({}));
                autoComplete = new AMap.Autocomplete({
                    city: ''
                });
                placeSearch = new AMap.PlaceSearch({
                    pageSize: 12, // ????????????????????????
                    children: 0, //????????????????????????
                    pageIndex: 1, //??????
                    extensions: 'base' //????????????????????????
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
                    if (!this.value["id"]) {
                        this.msg.warning("????????????????????????");
                        return;
                    }
                    getDetails(this.value["id"]);
                } else {
                    this.msg.warning("??????????????????");
                }
            };

            if (this.value) {
                getDetails(this.value.id);
            }


            //????????????
            function getDetails(id) {
                placeSearch.getDetails(id, (status, result) => {
                    if (status === 'complete' && result.info === 'OK') {
                        placeSearchCallBack(result);
                        that.valueChange.emit(JSON.stringify(that.value));
                    } else {
                        that.msg.warning("????????????????????????");
                    }
                });
            }

            //????????????
            function placeSearchCallBack(data) {
                let poiArr = data.poiList.pois;
                //??????marker
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

            function createContent(poi) {  //??????????????????
                let s = [];
                s.push("<b>?????????" + poi.name + "</b>");
                s.push("?????????" + poi.address);
                s.push("?????????" + poi.tel);
                s.push("?????????" + poi.type);
                s.push("?????????" + poi.location.lng);
                s.push("?????????" + poi.location.lat);
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
        //??????draw?????????????????????????????????
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
                        //???Marker???Option??????
                    });
                    break;
                }
                case 'polyline': {
                    this.mouseTool.polyline({
                        strokeColor: strokeColor
                        //???Polyline???Option??????
                    });
                    break;
                }
                case 'polygon': {
                    this.mouseTool.polygon({
                        fillColor: fillColor,
                        strokeColor: strokeColor
                        //???Polygon???Option??????
                    });
                    break;
                }
                case 'rectangle': {
                    this.mouseTool.rectangle({
                        fillColor: fillColor,
                        strokeColor: strokeColor
                        //???Polygon???Option??????
                    });
                    break;
                }
                case 'circle': {
                    this.mouseTool.circle({
                        fillColor: fillColor,
                        strokeColor: strokeColor
                        //???Circle???Option??????
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
        this.mouseTool.close(true); //???????????????????????????
        this.checkType = '';
    }


}
