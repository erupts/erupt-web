console.log("dev environment");

let eruptSiteConfig = window["eruptSiteConfig"];
eruptSiteConfig.domain = "http://localhost:9999";
eruptSiteConfig.fileDomain = "http://oos.erupt.xyz";
eruptSiteConfig.amapKey = "6ba79a8db11b51aeb1176bd4cfa049f4";
eruptSiteConfig.r_tools = [{
    text: "下载",
    icon: "fa-download",
    mobileHidden: true,
    click: function (event) {
        console.log(event);
    },
    load: function () {
        console.log("load");
    }
}];


//路由回调函数
window["eruptRouterEvent"] = {
    Test: {
        load: function (e) {
        },
        unload: function (e) {
        }
    },
    $: {
        load: function (e) {
        },
        unload: function (e) {
        }
    }
};

//全局生命周期回调函数
window["eruptEvent"] = {
    startup: function () {
        console.log(window["getAppToken"]());
    }
};

export const environment = {
    SERVER_URL: `./`,
    production: false,
    useHash: true,
    hmr: false,
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
