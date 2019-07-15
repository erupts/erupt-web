window.eruptSiteConfig = {
  //global config
  domain: "http://192.168.1.133:8080",
  title: "YuePeng Erupt", //通用数据管理框架
  desc: "通用数据管理框架",
  routerReuse: false,
  amapKey: "15bc4df0bd6758645308fa591f439799",
  r_tools: [{
    // html: `<h4>BTN</h4>`
  }, {
    icon: "fa-download",
    mobileShow: true,
    click: function(event, token) {
      console.log(event);
      console.log(token);
    }
  }]
};

