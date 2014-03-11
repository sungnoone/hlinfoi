/* 2014/01/01 start */
/* by wenjen sung */

//service name
//var SRV_GetListItems = "http://192.168.1.109:5000/api/items/"; // 需要URL參數
//var SRV_PostData = "http://192.168.1.109:5000/api/post/"; //上傳資料
//var SRV_QueryAll = "http://192.168.1.109:5000/api/query/all/"; // 查詢所有資料
//var SRV_GetImage = "http://192.168.1.109:5000/api/file/";//透過ID抓圖 需要URL參數
//var SRV_CheckUserHashCode = "http://192.168.1.109:5000/api/user/check/"; //驗證使用者雜湊碼(sha1) 需要URL參數

//var SRV_IP = "http://192.168.1.109:5000";
var SRV_IP = "http://infosrv.hanlin.com.tw";

var SRV_GetListItems = SRV_IP+"/api/items/";// 需要URL參數
var SRV_PostData = SRV_IP+"/api/post/";//上傳資料
var SRV_QueryAll = SRV_IP+"/api/query/all/"; // 查詢所有資料
var SRV_Security_QueryAll = SRV_IP+"/api/security/query/all/"; // 查詢所有資料(須驗證)
var SRV_GetImage = SRV_IP+"/api/file/";//透過ID抓圖 需要URL參數
var SRV_CheckUserHashCode = SRV_IP+"/api/user/check/"; //驗證使用者雜湊碼(sha1) 需要URL參數

var pictureSource;   // picture source
var destinationType; // sets the format of returned value
var file_items_infoYear = "info_year.txt";
var file_items_infoTarget = "info_Target.txt";
var file_items_infoClass = "info_Class.txt";
var file_items_infoField = "info_Field.txt";
var file_items_infoCreator = "info_Creator.txt";
//可以改成檔案或後端資料庫維護方式更具彈性
var FIELD_NAME_MAP = {
    "info_Year":"年段",
    "info_Content":"內容",
    "info_Field":"領域",
    "info_Create_Date":"建立日期",
    "info_Creator":"建立者",
    "info_Class":"情報種類",
    "info_Memo":"備註",
    "info_Target":"情報目標",
    "info_Subject":"主旨" };

var JSON_KEY_MAP_VALUE = "";
var file_account = "my.txt";

//認證資訊
var HASH_CODE = "";// sha256
var BASE64_CODE = "";// Encoding sha256 by base64
var USERNAME = "";
var PASSWORD = "";

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){
    pictureSource=navigator.camera.PictureSourceType;
    destinationType=navigator.camera.DestinationType;

    //Page2 select Items refresh
    $(document).delegate("#page2", "pagecreate", function(){
        listItemSetup('year','page2_txtYear');
        listItemSetup('target','page2_txtTarget');
        listItemSetup('creator','page2_txtCreator');
        listItemSetup('class','page2_txtClass');
        listItemSetup('field','page2_txtField');
    });

    // 進入帳號設定頁，提取存在檔案中的帳號資訊
    $(document).delegate("#page32", "pagecreate", function(){
        loadAccountInfo();
    });

}

/*$(document).ready(function(){

 })*/

/* ------------------------------------------ Func  ------------------------------------------*/

/*=============== datePicker() 日期欄位 ===================*/
{
    function datePicker(){
        var currentField = $("#page2_txtCreateDate");
        var myNewDate = new Date();

        // Same handling for iPhone and Android
        window.plugins.datePicker.show({
            date : myNewDate,
            mode : 'date', // date or time or blank for both
            allowOldDates : true
        }, function(returnDate) {
            var array = returnDate.split("/");
            var day = array[2], month = array[1];
            if (day <= 9)
                day = "0" + day;
            if (month <= 9)
                month = "0" + month;
            currentField.val(array[0] + "-" + month + "-" + day);
            // This fixes the problem you mention at the bottom of this script with it not working a second/third time around, because it is in focus.
            currentField.blur();
        });
    }
}

/*===============  fileSystemFail() Filesystem 共通性錯誤處理 ===================*/
{
    function fileSystemFail(error) {
        alert("FileSystem Fail!! "+error.code);
    }
}

/*=============== itemsSetup() 設定選項 ===================*/
{
    function listItemSetup(SelectFieldName, FieldId){
        //$('#'+FieldId).empty();
        // 檔案載入
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
            var itemsFileName = "";
            if(SelectFieldName=="year"){
                itemsFileName = file_items_infoYear;
            }else if(SelectFieldName=="target"){
                itemsFileName = file_items_infoTarget;
            }else if(SelectFieldName=="class"){
                itemsFileName = file_items_infoClass;
            }else if(SelectFieldName=="field"){
                itemsFileName = file_items_infoField;
            }else if(SelectFieldName=="creator"){
                itemsFileName = file_items_infoCreator;
            }

            fileSystem.root.getFile(itemsFileName, null, function(fileEntry){
                fileEntry.file(function(file){
                    var reader = new FileReader();
                    reader.onloadend = function(evt){
                        var s = evt.target.result;
                        //var lines = s.replace(/\r\n/g, "\n").split("\n");
                        var lines = s.split("\r\n");
                        //餵給選項
                        $('#'+FieldId).find("option").remove();
                        for(var v1=0; v1<lines.length; v1++){
                            //alert(lines[v1]);
                            try{
                                var obj_json = $.parseJSON(lines[v1]);// string to json
                                //如果值與顯示不同
                                //$('#'+FieldId).append('<option value="' + obj_json.value + '">' + obj_json.name + '</option>');
                                //如果值與顯示相同
                                $('#'+FieldId).append('<option value="' + obj_json.name + '">' + obj_json.name + '</option>');
                            }catch(err) {
                                alert(err.toString());
                            }
                        }
                    }
                    reader.readAsText(file);
                }, fileSystemFail);
            }, fileSystemFail);
        }, fileSystemFail);
    }
}

/*=============== updateItemsList() 更新選項來源 =================== */
// year , target , field , class , creator
{
    function updateItemsList(SelectFieldName){
        //從遠端服務更新，存入檔案
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
            var itemsFileName = "";
            if(SelectFieldName=="year"){
                itemsFileName = file_items_infoYear;
            }else if(SelectFieldName=="target"){
                itemsFileName = file_items_infoTarget;
            }else if(SelectFieldName=="class"){
                itemsFileName = file_items_infoClass;
            }else if(SelectFieldName=="field"){
                itemsFileName = file_items_infoField;
            }else if(SelectFieldName=="creator"){
                itemsFileName = file_items_infoCreator;
            }
            fileSystem.root.getFile(itemsFileName, {create: true, exclusive: false}, function(fileEntry){
                fileEntry.createWriter(function(writer){
                    writer.onwriteend = function(evt) {
                        alert(itemsFileName+"更新完成!");
                    };
                    //從遠端服務更新
                    var request = $.ajax({
                        url:SRV_GetListItems+SelectFieldName+"/",
                        type: 'GET',
                        contentType: 'application/json; charset=utf-8', //"text/html; charset=utf-8"
                        dataType: 'json',
                        success:function(r){
                            var optionsStr = "";
                            //alert(r.toLocaleString());
                            var rCount = 0;
                            for(var key in r){
                                var count = 0;
                                var item = $.parseJSON(r[key]);
                                if(item){
                                    //var title = count.toString();
                                    if(rCount==0){
                                        optionsStr += "{";
                                    }else{
                                        optionsStr += "\r\n{";
                                    }
                                    for(var key1 in item){
                                        if (count == 0){
                                            optionsStr += "\"" +key1 + "\":\"" + item[key1] + "\"";
                                            //optionsStr += key1 + ":" + item[key1];
                                        }else{
                                            optionsStr += ",\"" + key1 + "\":\"" + item[key1] + "\"";
                                            //optionsStr += "," + key1 + ":" + item[key1];
                                        }
                                        count++;
                                    }
                                    optionsStr += "}";
                                }
                                rCount++;
                            }
                            writer.write(optionsStr);//結果寫入
                        },
                        error:function(error){
                            alert("updateItemsFile_infoYear error: " + error.toString());
                        }
                    });
                },fileSystemFail);
            }, fileSystemFail);
        }, fileSystemFail);
    }
}

/*=============== page2_Camera() 使用照相 ===================*/
{
    // 使用照相
    function page2_Camera(source){
        navigator.camera.getPicture(
            function(imageURI){
                var largeImage = document.getElementById('page2_cameraImage');
                largeImage.style.display = 'block';
                largeImage.src = imageURI;
            },
            function(evt){
                alert(evt.target.error.code);
            },
            {
                quality: 50,
                destinationType: destinationType.FILE_URI,
                allowEdit:true,
                saveToPhotoAlbum:true,
                correctOrientation:true,
                sourceType:source
            });
    }
}

/*=============== page2_Save() 儲存資料 ===================*/
{
    //儲存資料
    function page2_Save(){
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
            function(fileSystem){
                var image_path = $("#page2_cameraImage").prop("src"); // 取得照相圖檔位置
                var rootDir = fileSystem.root;//檔案系統根路徑(filesystem用法上Phonegap官網API文件詳查)
                // 因為是從root開始抓，只要 root 以下的路徑，root自身路徑不要
                var image_rel_path = image_path.replace(rootDir.fullPath+"/", "");
                //照片+表單資料 傳遞給遠端服務
                var fs = rootDir.getFile(image_rel_path, null,
                    function(fileEntry){
                        fileEntry.file(function(file){
                            var upload_url = SRV_PostData; // 遠端服務位置，SRV_Post 在 main.js 開始即已定義的全域變數
                            var options = new FileUploadOptions(); // 檔案上傳選項
                            var filename = file.fullPath;
                            // 傳送選項設定
                            options.fileKey = "info_img1"; // 圖檔 key name，服務端抓取時可能會用到
                            options.fileName = filename.substr(filename.lastIndexOf("/")+1); // 不含路徑的檔案名稱
                            options.mimeType = "image/jpeg"; // 檔案型態是圖檔
                            // 傳送參數設定
                            var params = {};
                            // 表單文字資料藉由 Filesystem 的 FileTransfer 上傳檔案之便，以參數型式順便丟過去
                            // 表單欄位ID、參數鍵名、後台服務端抓取鍵名，及資料庫欄位應做好一致性規劃對應
                            // 亦可規劃中介端對應代理物件機制，但架構較為複雜，此例僅以簡便能通為原則。
                            params.info_Year = $("#page2_txtYear").val();
                            params.info_Create_Date = $("#page2_txtCreateDate").val();
                            params.info_Target = $("#page2_txtTarget").val();
                            params.info_Creator = $("#page2_txtCreator").val();
                            params.info_Class = $("#page2_txtClass").val();
                            params.info_Field = $("#page2_txtField").val();
                            params.info_Subject = $("#page2_txtSubject").val();
                            params.info_Content = $("#page2_txtContent").val();
                            params.info_Memo = $("#page2_txtMemo").val();
                            options.params = params; // 參數也是選項的一種
                            var ft = new FileTransfer(); // 啟動 Phonegap Filesystem FileTransfer
                            // 開始上傳
                            ft.upload(filename, upload_url,
                                function(r){ // 成功
                                    alert("Code = " + r.responseCode);
                                    alert("Response = " + r.response);
                                    alert("Sent = " + r.bytesSent);
                                },
                                function(error){ // 錯誤
                                    alert("An error has occurred: Code = " + error.code);
                                    alert("upload error source " + error.source);
                                    alert("upload error target " + error.target);
                                },
                                options, true);
                        }, page2_Submit_Fail);
                    },
                    function(error){ // getFile error
                        alert("filesystem getFile fail: "+error.code);
                    });
            },
            page2_Submit_Fail // requestFileSystem error
        );
    }
    // common error handler
    function page2_Submit_Fail(evt){
        alert(evt.target.error.code);
    }
}

/*=============== page1_QueryData() 查詢資料 ===================*/
function page1_QueryData(){
    //清除舊結果，避免累加顯示
    $('#page1_first_content').empty();
    // 使用 jQuery ajax 取得遠端資料。
    // SRV_QueryAll：在全域變數即定義的查詢資料服務位址。
    // 服務傳回的資料型態為JSON格式字串。
    // 若與服務端溝通格式非JSON，應適當修正ajax參數，參考jQuery官網說明文件。
    var request = $.ajax({
        url:SRV_QueryAll,
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success:function(r){
            var count = 0; // 計算資料筆數，偵錯兼充當collapsible的抬頭
            for(var key in r){
                count++;
                var item = $.parseJSON(r[key]); // 轉化為json物件。
                if(item){
                    var title = count.toString(); // 以計數作為collapsible的抬頭，可另以具意義字串替代。
                    var span_content1 = ''; // 內容收集變數
                    // 處理每筆資料每個欄位。
                    for(var key1 in item){
                        // 如果是圖片欄位，取得ID值，然後透過ID值，通知伺服器備妥檔案。
                        if(key1=='image'){
                            //圖片資料
                            var image_id_object = item[key1];
                            // 由於後台是 mongodb，image 欄位儲存的是 ID 物件，透過 $oid 鍵名取值
                            // 若是一般關聯式或單存只儲存ID字串，則直接 item[key1]取值即可。　
                            var image_id = image_id_object['$oid'];
                            // 此例不將圖檔存放行動裝置內，而是讓伺服器將檔案準備就緒的完整網址傳送回來
                            // 傳送 ID 給遠端服務，備妥檔案後，傳回圖檔完整的URL
                            var image_url = SRV_GetImage + image_id;
                        }else{
                            //如果是文字資料欄位，直接安排呈現方式
                            compareJSONKeyReturnValue(key1, FIELD_NAME_MAP);
                            span_content1 += '<p>'+JSON_KEY_MAP_VALUE+':'+item[key1]+'</p>';
                        }
                    }
                    // 有圖片的網頁呈現方式安排
                    // 這裡只簡單利用 jQuery Mobile 的 Collapsible 物件呈現。
                    if(image_url){
                        span_content1 += '<img  style="width: 100px; height: 100px" src="'+ image_url +'" />';
                    }
                    var html = '<div data-role="collapsible" data-collapsed="true"><h3>'+title+'</h3><span style="text-align: left">'+span_content1+'</span></div>';
                    var $element = $(html).appendTo($('#page1_first_content'));
                    $element.collapsible();
                }
            }
        },
        error:function(error){
            alert("An error has occurred: Code = " + error.code);
            alert("upload error source " + error.source);
            alert("upload error target " + error.target);
        }
    });
}

/*=============== page4_QueryData() 查詢資料(須驗證) ===================*/
function page4_QueryData(){
    if(HASH_CODE=="" || HASH_CODE==null || HASH_CODE=="undefined" || HASH_CODE==false){
        return false;
    }
    if(BASE64_CODE=="" || BASE64_CODE==null || BASE64_CODE=="undefined" || BASE64_CODE==false){
        return false;
    }
    alert(BASE64_CODE);
    //清除舊結果，避免累加顯示
    $('#page4_first_content').empty();
    // 使用 jQuery ajax 取得遠端資料。
    // SRV_QueryAll：在全域變數即定義的查詢資料服務位址。
    // 服務傳回的資料型態為JSON格式字串。
    // 若與服務端溝通格式非JSON，應適當修正ajax參數，參考jQuery官網說明文件。
    var auth_code = '{"auth_code":"' +BASE64_CODE + '"}';
    alert(auth_code);
    var request = $.ajax({
        url:SRV_Security_QueryAll,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data:auth_code,
        dataType: 'json',
        success:function(r){
            var count = 0; // 計算資料筆數，偵錯兼充當collapsible的抬頭
            for(var key in r){
                count++;
                var item = $.parseJSON(r[key]); // 轉化為json物件。
                if(item){
                    var title = count.toString(); // 以計數作為collapsible的抬頭，可另以具意義字串替代。
                    var span_content1 = ''; // 內容收集變數
                    // 處理每筆資料每個欄位。
                    for(var key1 in item){
                        // 如果是圖片欄位，取得ID值，然後透過ID值，通知伺服器備妥檔案。
                        if(key1=='image'){
                            //圖片資料
                            var image_id_object = item[key1];
                            // 由於後台是 mongodb，image 欄位儲存的是 ID 物件，透過 $oid 鍵名取值
                            // 若是一般關聯式或單存只儲存ID字串，則直接 item[key1]取值即可。　
                            var image_id = image_id_object['$oid'];
                            // 此例不將圖檔存放行動裝置內，而是讓伺服器將檔案準備就緒的完整網址傳送回來
                            // 傳送 ID 給遠端服務，備妥檔案後，傳回圖檔完整的URL
                            // 如果是完整驗證，圖片服務也應使用具有驗證要求的服務網址
                            var image_url = SRV_GetImage + image_id;
                        }else{
                            //如果是文字資料欄位，直接安排呈現方式
                            compareJSONKeyReturnValue(key1, FIELD_NAME_MAP);
                            span_content1 += '<p>'+JSON_KEY_MAP_VALUE+':'+item[key1]+'</p>';
                        }
                    }
                    // 有圖片的網頁呈現方式安排
                    // 這裡只簡單利用 jQuery Mobile 的 Collapsible 物件呈現。
                    if(image_url){
                        span_content1 += '<img  style="width: 100px; height: 100px" src="'+ image_url +'" />';
                    }
                    var html = '<div data-role="collapsible" data-collapsed="true"><h3>'+title+'</h3><span style="text-align: left">'+span_content1+'</span></div>';
                    var $element = $(html).appendTo($('#page4_first_content'));
                    $element.collapsible();
                }
            }
        },
        error:function(error){
            alert("An error has occurred: Code = " + error.code);
            alert("upload error source " + error.source);
            alert("upload error target " + error.target);
        }
    });
}

/*=============== compareJSONKeyReturnValue() 比對JSON取值 ===================*/
function compareJSONKeyReturnValue(compareString, jsonObject){
    JSONMAPVALUE = "";
    try{
        jQuery.each(jsonObject, function(i, val){
            if(i==compareString){
                JSON_KEY_MAP_VALUE = val;
            }
        });
    }catch (ex){
        return ex.toString();
    }
}

/*=============== saveUserAccount()  儲存帳號資訊===================*/
function saveUserAccount(){
    //儲存帳號資訊
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        alert("Before saving file");
        var username = $("#page32_UserName").val();
        var password = $("#page32_Password").val();
        fileSystem.root.getFile(file_account, {create: true, exclusive: false}, function(fileEntry){
            fileEntry.createWriter(function(writer){
                writer.onwriteend = function(evt) {
                    alert(file_account+"儲存完成!");
                };
                writer.write('{"username":"'+username.toUpperCase()+'","password":"'+password+'"}');//結果寫入
                alert("After saving file");
            },fileSystemFail);
        }, fileSystemFail);
    }, fileSystemFail);
    //帳號儲存完畢，一律順便更新帳號資訊相關變數資訊
    //其他功能在執行時，就不要重複執行讀取帳號檔案的動作。
    // 帳號資訊檔案載入
    alert("Before Load file");
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        fileSystem.root.getFile(file_account, null, function(fileEntry){
            fileEntry.file(function(file){
                var reader = new FileReader();
                reader.onloadend = function(evt){
                    var s = evt.target.result;
                    var obj_json = $.parseJSON(s);
                    USERNAME = obj_json.username.toUpperCase();
                    PASSWORD = obj_json.password;
                    HASH_CODE = $.sha256(USERNAME+PASSWORD);
                    BASE64_CODE = $.base64.btoa(HASH_CODE,true);
                };
                reader.readAsText(file);
                alert("After Load file");
            }, fileSystemFail);
        }, fileSystemFail);
    }, fileSystemFail);
}

/*=============== securityCheck()  提取帳號資訊驗證===================*/
function userCheck(){
    // 帳號資訊檔案載入
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        fileSystem.root.getFile(file_account, null, function(fileEntry){
            fileEntry.file(function(file){
                var reader = new FileReader();
                reader.onloadend = function(evt){
                    var s = evt.target.result;
                    var obj_json = $.parseJSON(s);
                    HASH_CODE = $.sha256(obj_json.password);
                    USERNAME = obj_json.username;
                    PASSWORD = obj_json.password;
                }
                reader.readAsText(file);
            }, fileSystemFail);
        }, fileSystemFail);
    }, fileSystemFail);

    //傳送資訊驗證
    if(HASH_CODE=="" || HASH_CODE==null || HASH_CODE=="undefined" || HASH_CODE==false){
        return false;
    }
    var request = $.ajax({
        url:SRV_CheckUserHashCode+HASH_CODE,
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success:function(r){
            //alert("OK! ");
            var count = 0;
            for(var key in r){
                count++;
                var item = $.parseJSON(r[key]);
                if(item){
                    var title = count.toString();
                    var span_content1 = '';
                    for(var key1 in item){
                        if(key1=='image'){
                            //圖片資料
                            var image_id_object = item[key1];
                            var image_id = image_id_object['$oid'];
                            var image_url = SRV_GetImage + image_id;
                        }else{
                            //文字資料
                            compareJSONKeyReturnValue(key1, FIELD_NAME_MAP);
                            //span_content1 += '<p>'+key1+':'+item[key1]+'</p>';
                            span_content1 += '<p>'+JSON_KEY_MAP_VALUE+':'+item[key1]+'</p>';
                        }
                    }
                    // 有圖片
                    if(image_url){
                        span_content1 += '<img  style="width: 100px; height: 100px" src="'+ image_url +'" />';
                    }
                    var html = '<div data-role="collapsible" data-collapsed="true"><h3>'+title+'</h3><span style="text-align: left">'+span_content1+'</span></div>';
                    var $element = $(html).appendTo($('#page1_first_content'));
                    $element.collapsible();
                }
            }
        },
        error:function(error){
            alert("An error has occurred: Code = " + error.code);
            alert("upload error source " + error.source);
            alert("upload error target " + error.target);
        }
    });

}

/*=============== makeSecurityCode()  提取帳號資訊驗證===================*/
function makeSecurityCode(){
    // 帳號資訊檔案載入
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        fileSystem.root.getFile(file_account, null, function(fileEntry){
            fileEntry.file(function(file){
                var reader = new FileReader();
                reader.onloadend = function(evt){
                    var s = evt.target.result;
                    var obj_json = $.parseJSON(s);
                    USERNAME = obj_json.username.toUpperCase();
                    alert(USERNAME);
                    PASSWORD = obj_json.password;
                    alert(PASSWORD);
                    HASH_CODE = $.sha256(USERNAME+PASSWORD);
                    alert(HASH_CODE);
                    BASE64_CODE = $.base64.btoa(HASH_CODE,true);
                    alert(BASE64_CODE);
                };
                reader.readAsText(file);
            }, fileSystemFail);
        }, fileSystemFail);
    }, fileSystemFail);
}

/*=============== loadAccountInfo()  載入帳號資訊到頁面上===================*/
function loadAccountInfo(){
    // 帳號資訊檔案載入
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        fileSystem.root.getFile(file_account, null, function(fileEntry){
            fileEntry.file(function(file){
                var reader = new FileReader();
                reader.onloadend = function(evt){
                    var s = evt.target.result;
                    var obj_json = $.parseJSON(s);
                    USERNAME = obj_json.username.toUpperCase();
                    PASSWORD = obj_json.password;
                    HASH_CODE = $.sha256(USERNAME+PASSWORD);
                    BASE64_CODE = $.base64.btoa(HASH_CODE,true);
                    $("#page32_UserName").attr("value", USERNAME);
                    $("#page32_Password").attr("value", PASSWORD);
                };
                reader.readAsText(file);
            }, fileSystemFail);
        }, fileSystemFail);
    }, fileSystemFail);
}


