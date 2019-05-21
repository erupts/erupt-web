//global config
window.domain = "http://192.168.1.133:8080";
window.title = "TITLE..." ; //通用数据管理框架
//高德地图的应用key
window.mapKey = "15bc4df0bd6758645308fa591f439799";

window.r_tools = [{
  html: "<h4 style='color: #fff;'>YuePeng</h4>"
}, {
  icon: "fa-download",
  mobileShow: true,
  click: function(event, token) {
    console.log(event);
    console.log(token);
  }
}];