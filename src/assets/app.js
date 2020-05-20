window.eruptSiteConfig = {
    //global config
    domain: "http://localhost:9999",
    fileDomain: "http://qa5mh744r.bkt.clouddn.com",
    title: "Erupt Framework", //通用数据管理框架
    desc: "通用数据管理框架",
    routerReuse: false,
    amapKey: "6ba79a8db11b51aeb1176bd4cfa049f4",
    dialogLogin: true,
    logoPath: "/assets/logo.svg",
    logoText: "Erupt",
    // registerPage:"http://www.baidu.com",
    r_tools: [{
        text: "下载",
        icon: "fa-download",
        mobileHidden: true,
        click: function (event) {
            console.log(event);
        },
        load: function () {
        }
    }]
};
window.eruptRouterEvent = {
    Router: {
        load: function (url) {

        },
        unload: function (url) {
        }
    },
    $: {
        load: function (url) {

        },
        unload: function (url) {
        }
    }
};

window.eruptEvent = {
    startup: function () {

    }
};
