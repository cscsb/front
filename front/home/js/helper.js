//判断当前浏览类型
function BrowserType()
{
    var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
    var isOpera = userAgent.indexOf("Opera") > -1; //判断是否Opera浏览器
    var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE浏览器
    var isEdge = userAgent.indexOf("Windows NT 6.1; Trident/7.0;") > -1 && !isIE; //判断是否IE的Edge浏览器
    var isFF = userAgent.indexOf("Firefox") > -1; //判断是否Firefox浏览器
    var isSafari = userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") == -1; //判断是否Safari浏览器
    var isChrome = userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Safari") > -1; //判断Chrome浏览器

    if (isIE)
    {
        var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
        reIE.test(userAgent);
        var fIEVersion = parseFloat(RegExp["$1"]);
        return {name:"IE",num: fIEVersion};
    }//isIE end

    if (isFF) { return {name:"FF",num: "FF"};}
    if (isOpera) { return {name:"Opera",num: "Opera"};}
    if (isSafari) { return {name:"Safari",num: "Safari"};}
    if (isChrome) { return {name:"Chrome",num: "Chrome"};}
    if (isEdge) { return {name:"Edge",num: "Edge"};}
}
console.log (navigator.appVersion)
Browser = BrowserType();
