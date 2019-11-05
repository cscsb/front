/**
 * Created by miyaye on 2019/10/19.
 */
"use strict";

var data = []; //分类初始化

var items = []; //当前 items 需要根据菜单id来请求获取

var images = []; //图片列表初始化

var isItem; //拖拽的是否是item

var isImage; //拖拽的是否是image

var isCat; //拖拽的是否是 cat
//当前菜单Id

var curCatId = 0;
var curItemId;
var curImageId; //菜单列表html
//菜单列表html

var menus = '';
$.ajaxSetup({
    type: "POST",
    error: function error(xhr, status, _error) {
        console.log(_error);
    },
    complete: function complete(xhr, status) {
        if (xhr.responseJSON.code !== 200) {
            alert(xhr.responseJSON.msg);
        }
    }
}); //根据菜单主键id生成菜单列表html
//id：菜单主键id
//arry：菜单数组信息

function getData(id, arry) {
    var childArry = GetParentArry(id, arry);

    if (childArry.length > 0) {
        var hideClass = childArry[0].lev == 0 ? '' : ' hide';
        menus += '<ul class="level-' + childArry[0].lev + hideClass + '">';

        for (var i in childArry) {
            var curId = childArry[i].id;
            var imageClass = childArry[i]['isImage'] == 1 ? 'imageLi' : '';
            var className = curId == curCatId ? 'active' : '';
            var folderClass = data.find(function (item) {
                return item.pid == curId;
            }) ? 'folder' : '';
            var icon = folderClass ? "<span class=\"iconfont icon-page-right\" onclick=\"fnToggle(event)\"></span> " : '';
            className = className + ' menuItem ' + imageClass;
            menus += '<li data-pid="' + id + '"  class="' + className + folderClass + '" style="text-indent: ' + (childArry[0].lev * 10 + 10) + 'px" draggable="' + (!!childArry[i]['istrash'] || !!childArry[i]['isImage'] ? false : true) + '" data-istrash="' + (!!childArry[i]['istrash'] ? 1 : 0) + '" data-isimage="' + (!!childArry[i]['isImage'] ? 1 : 0) + '" data-id="' + childArry[i].id + '" data-lev="' + childArry[i].lev + '"  ondragstart="fnDragStartCat(event)" onclick="fnClick(event)" ondrop="fnDrop(event)" ondragover="fnDragOver(event)" ondragenter="fnDragEnter(event)" ondragleave="fnDragLeave(event)">' + icon + childArry[i].name;
            getData(childArry[i].id, arry);
            menus += '</li>';
        }

        menus += '</ul>';
    }
} //获取所有菜单


$.post(getMenuUrl, {
    uid: 1
}).then(function (res) {
    if (res.code == '200') {
        data = res.data;
        data.push({
            id: 9999,
            name: "回收站",
            pid: 0,
            istrash: true
        });
        data.unshift({
            id: 8888,
            name: '图片',
            pid: 0,
            isImage: true
        });
        getData(0, sonsTree(data, 0));
        $("#menuList").html(menus);
    }
});

function sonsTree(arr, id) {
    var temp = [],
        lev = 0;

    var forFn = function forFn(arr, id, lev) {
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];

            if (item.pid == id) {
                item.lev = lev;
                temp.push(item);
                forFn(arr, item.id, lev + 1);
            }
        }
    };

    forFn(arr, id, lev);
    return temp;
} //添加菜单


function addMenu() {
    bootbox.prompt({
        title: "添加菜单",
        centerVertical: true,
        callback: function callback(result) {
            if (result == null) return;

            if (result == '') {
                bootbox.alert('菜单名称不能为空');
            } else {
                $.post(addMenuUrl, {
                    "uid": 1,
                    "pid": curCatId,
                    "name": result,
                    "orderid": 0
                }).then(function (res) {
                    if (res.code == 200) {
                        data.splice(1, 0, res.data);
                        menus = '';
                        getData(0, sonsTree(data, 0));
                        $('#menuList').html(menus);
                    }
                });
            }
        }
    });
    return false;
} //根据菜单主键id获取下级菜单
//id：菜单主键id
//arry：菜单数组信息


function GetParentArry(id, arry) {
    var newArry = [];

    for (var i in arry) {
        if (arry[i].pid == id) newArry.push(arry[i]);
    }

    return newArry;
} //item event: start


function fnDragStart(ev) {
    console.log('drag start');
    var event = ev || window.event;
    isItem = true;
    isCat = isImage = false;
    curItemId = $(event.target).data('id');

    if (Browser && Browser.name == 'FF') {
        event.dataTransfer.setData('curItemId', $(event.target).data('id'));
    }
}

function fnEditItem(name) {
    $(event.target).hide().siblings('.item-cont').text('').html("<input class=\"form-control editinput\" value=\"".concat(name, "\" type=\"text\" onblur=\"fnComplete()\" /><!--<button onclick=\"fnComplete()\">\u5B8C\u6210</button>-->"));
    $('.editinput').focus();
}

function fnComplete() {
    var id = $(event.target).parents('.item').data('id');
    var val = $(event.target).closest('.editinput').val();
    var target = event.target;
    $.post(setItemUrl, {
        itemid: id,
        content: val
    }).then(function (res) {
        if (res.code == 200) {
            $(target).parent('.item-cont').html(val).siblings('.edit-item').show();
            $('.editinput').remove();
            data = data.map(function (item) {
                if (item.id == id) {
                    return res.data;
                }
            });
        }
    });
} //item event: end
//cat event: start


function fnClick(ev) {
    var event = ev || window.event;
    curCatId = $(event.target).data('id');
    curItemId = curItemId = null;
    $('#addMenu').removeAttr('disabled');
    $('#sidebar li').removeClass('active');
    !!event && $(event.target).addClass('active');

    var trash = istrash(event)

    if ( trash && !!event && $(event.target).hasClass('imageLi')) {
        //请求该分类下的图片列表
        $.post(getImageUrl, {
            uid: 1
        }).then(function (res) {
            if (res.code == 200) {
                images = res.data;
                renderImages();
            }
        });
    }

    if (trash){
        return;
    }
    renderItems();
    !!event && event.stopPropagation();
}

function renderItems() {
    //请求该分类下的item列表
    $.post(getCatyitemUrl, {
        mid: curCatId
    }).then(function (res) {
        items = res.data.item;
        var str = '';
        items.forEach(function (item) {
            return str += "<div  class=\"item\" data-id=\"".concat(item.id, "\"><span data-id=\"").concat(item.id, "\" draggable=\"true\" ondragstart=\"fnDragStart(event)\"  class=\"item-cont\">").concat(item.content, "</span><span class=\"edit-item iconfont icon-edit1\" data-item=\"").concat(item, "\" onclick=\"fnEditItem('").concat(item.content, "')\"></span></div>");
        });

        var catArr = data.filter(function (item) {
            return item.pid == curCatId;
        });

        if (catArr.length) {
            str += "<ul>";
            catArr.forEach(function (cat) {
                return str += "<li class=\"menuItem\" data-id=\"".concat(cat['id'], "\" data-pid=\"").concat(curCatId, "\" \n                draggable=\"true\" ondragstart=\"fnDragStartCat(event)\" \n                ondrop=\"fnDrop(event)\" ondragover=\"fnDragOver(event)\" \n                ondragenter=\"fnDragEnter(event)\" ondragleave=\"fnDragLeave(event)\">\n                <span class=\"iconfont icon-folder\"></span>").concat(cat['name'], "</li>");
            });
            str += '</ul>';
        }

        $('.itemList').html(str);
    });
}

function renderImages() {
    var str = '';
    images.forEach(function (item) {
        return str += "<div draggable=\"true\" ondragstart=\"fnDragStartImage(event)\"  data-id=\"".concat(item.id, "\"  class=\"item-image\"><img   data-id=\"").concat(item.id, "\" src=\"").concat(item.attachment, "\" alt=\"\"></div>");
    });
    $('.itemList').html('<div class="image-container">' + str + '</div>');
}

function istrash(event) {
    var res = false;
    if(!event.target)  return false;
    switch (event.target['tagName']) {
        case 'SPAN':
            res = $(event.target).parent('li').data('istrash') == 1 || $(event.target).parent('li').data('isimage') == 1;
            break;

        case 'LI':
            res = $(event.target).data('istrash') == 1 || $(event.target).data('isimage') == 1;
            break;
        default :
            res = false;
            break;
    }

    return res;
}

function fnDragStartCat(ev) {
    var event = ev || window.event;
    isItem = isImage = false;
    isCat = true;
    curCatId = $(event.target).data('id');

    if (Browser && Browser.name == 'FF') {
        event.dataTransfer.setData('catId', $(event.target).data('id'));
    }
} //开始拖拽图片


function fnDragStartImage(ev) {
    var event = ev || window.event;
    curItemId = $(event.target).data('id');

    if (Browser && Browser.name == 'FF') {
        event.dataTransfer.setData('curItemId', $(event.target).data('id'));
    }

    isItem = isCat = false;
    isImage = true;
}

function fnDragLeave(ev) {
    var event = ev || window.event;
    $(event.target).removeClass('active');
    var target = event.target.tagName == 'LI' ? event.target : event.target.parentNode;

    if (istrash(event.target)) {
        if ($(target).data('isimage') == '0') {
            event.target.style.background = '#ddd';
        }
    } else {
        target.style.background = '';
    }
}

function fnDragOver(ev) {
    var event = ev || window.event;

    if(Browser && Browser.name == 'FF'){
        if (istrash(ev)) {
            if ($(event.target).data('isimage') == '0') {
                event.target.style.background = '#cc0000';
            }
        } else {
            if (isItem && event.target.tagName == 'LI') {
                event.target.style.background = '#d0f7c1';
            } else if (isItem) {
                console.log($(event.target).parent('li'));
                $(event.target).parent('li').css('background', '#d0f7c1');
            }
        }
    }

    event.preventDefault();
}

function fnDragEnter(ev) {

    var event = ev || window.event;
    console.log('drag over');
    if(Browser && Browser.name !== 'FF') {
        if (istrash(ev)) {
            if ($(event.target).data('isimage') == '0') {
                event.target.style.background = '#cc0000';
            }
        } else {
            if (isItem && event.target.tagName == 'LI') {
                event.target.style.background = '#d0f7c1';
            } else if (isItem) {
                console.log($(event.target).parent('li'));
                $(event.target).parent('li').css('background', '#d0f7c1');
            }
        }
    }
    event.preventDefault();
}

function fnDrop(ev) {
    var event = ev || window.event;
    $('#addMenu').attr('disabled', true);
    $(event.target).removeClass('active');
    var sourceCatId = curCatId;
    var sourceItemId = curItemId;
    var targetCatId = $(event.target).data('id');

    if (istrash(event.target)) {
        event.target.style.background = '#ddd';
        if ($(event.target).data('isimage') == 1) return;

        if (isCat) {
            //删除分类
            $.post(deleteMenuUrl, {
                mid: sourceCatId
            }).then(function (res) {
                if (res.code == 200) {
                    $('li[data-id="' + sourceCatId + '"]').remove();
                    bootbox.alert('分类删除成功');
                }
            });
        } else if (isItem) {
            //删除item
            $.post(deleteItemUrl, {
                itemid: sourceItemId
            }).then(function (res) {
                if (res.code == 200) {
                    $('div[data-id="' + sourceItemId + '"]').remove();
                    bootbox.alert('item删除成功');
                }
            });
        } else {
            //删除图片
            $.post(deleteImagesUrl, {
                imageid: sourceItemId
            }).then(function (res) {
                if (res.code == 200) {
                    $('img[data-id="' + sourceItemId + '"]').parent().remove();
                    bootbox.alert('图片删除成功');
                }
            });
        }
    } else {
        event.target.style.background = '';

        if (isItem) {
            //归类item到某个分类下
            $.post(mvItemUrl, {
                itemid: sourceItemId,
                mid: targetCatId
            }).then(function (res) {
                if (res.code == 200) {
                    data = data.map(function (item) {
                        if (item.id == targetCatId) {
                            item = res.data;
                        }

                        return item;
                    });
                    $('div[data-id="' + sourceItemId + '"]').remove();
                }
            });
        }
    }

    if (isItem) isItem = null;
} //cat event: end
//添加 item


function fnAdd(self) {
    if (!curCatId || curCatId == 8888 || curCatId == 9999) {
        bootbox.alert('请选择一个非图片的类目');
        return;
    }

    if ($('.newItemInput').val() == '') {
        bootbox.alert('请输入item内容');
        return;
    }

    $.post(addItemUrl, {
        mid: curCatId,
        uid: 1,
        content: $('.newItemInput').val()
    }).then(function (res) {
        if (res.code == 200) {
            items.unshift(res.data); //列表重新渲染

            renderItems(); //清除输入框数据

            $('.newItemInput').val('');
        }
    });
} //选择文件


function fnChangeFile() {
    var file = event.target.files[0];
    var data = new FormData();
    data.append('uid', 1);
    data.append('fileimg', file);
    $.ajax({
        type: 'post',
        url: uploadImagesUrl,
        data: data,
        processData: false,
        contentType: false,
        success: function success(res) {
            if (res.code == 200) {
                images.push(res.data);
                renderImages();
            }
        },
        error: function error(err) {}
    });
}
/**取消冒泡**/


function stopPro(e) {
    if (e && e.stopPropagation) {
        //W3C取消冒泡事件
        e.stopPropagation();
    } else {
        //IE取消冒泡事件
        window.event.cancelBubble = true;
    }
}

function fnToggle(ev) {
    var event = ev || window.event;
    $(event.target).toggleClass('icon-page-right icon-right');
    $(event.target).parent('li.folder').toggleClass('open');
    $(event.target).siblings('ul').toggleClass('hide');
    stopPro(event);
}

$('#showAddItemBtn').on('click', function () {
    $('.addItem').toggleClass('hide');
});