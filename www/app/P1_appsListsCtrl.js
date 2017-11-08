/**
 * Created by User on 08/09/2016.
 */
var app = angular.module('pele.P1_appsListCtrl', ['ngStorage']);
//=====================================================================//
//==                         PAGE_1                                  ==//
//=====================================================================//
app.controller('P1_appsListCtrl', function($scope, $http, $state, $ionicLoading, PelApi, $rootScope, $ionicPopup, $ionicHistory, $sessionStorage, $localStorage, appSettings, srvShareData) {

  $ionicHistory.clearHistory();
  PelApi.lagger.checkFile().then(function(logStat) {
    if (logStat.size > (1024 * 1024)) {
      PelApi.lagger.deleteLogfile().then(function() {
        PelApi.lagger.error("flush Log file ...  log too big ...( > 1MB) ")
      })
    }
  })


  //=======================================================//
  //== When        Who         Description               ==//
  //== ----------  ----------  ------------------------- ==//
  //== 27/12/2015  R.W.                                  ==//
  //=======================================================//
  $scope.pushBtnClass = function(event) {


    if (event === true) {
      return "pele-item-on-release";
    } else {
      return "pele-item-on-touch";
    }
  } // pushBtnClass

  $scope.onBtnAction = function() {
    btnClass.activ = !btnClass.activ;
  };

  $scope.insertOnTouchFlag = function(arr) {
    var myArr = [];
    for (var i = 0; i < arr.length; i++) {
      var myObj = {
        AppId: arr[i].AppId,
        ApplicationType: arr[i].ApplicationType,
        DisplayName: arr[i].DisplayName,
        Image: arr[i].Image,
        Path: arr[i].Path,
        Pin: arr[i].Pin,
        WorkState: arr[i].WorkState,
        PUSH_FLAG: true
      };
      myArr.push(myObj);
    }

    return myArr;
  }

  /*
   * ==========================================================
   *                    GetUserMenuMain
   * ==========================================================
   */
  $scope.GetUserMenuMain = function() {

    var Rendred = false;
    var links = PelApi.getDocApproveServiceUrl("GetUserMenu");
    if (appSettings.config.IS_TOKEN_VALID !== 'Y')
      delete $sessionStorage.mainMenu;

    if (appSettings.config.mainMenuKeepAlive && $sessionStorage.mainMenu) {
      var now = new Date().getTime()
      var mm = $sessionStorage.mainMenu;
      if (mm && mm.timeStamp && mm.menuItems) {
        if ((now - mm.timeStamp) < (appSettings.config.mainMenuKeepAlive) * 1000) {
          $scope.feeds_categories = mm.menuItems;
          $scope.feeds_categories.menuItems = $scope.insertOnTouchFlag($scope.feeds_categories.menuItems);
          $ionicLoading.hide();
          $scope.$broadcast('scroll.refreshComplete');
          Rendred = true;
        }
      } else {
        delete $sessionStorage.mainMenu;
      }
    }

    try {
      var reMenu = PelApi.getMenu(links);
    } catch (e) {
      var isAndroid = ionic.Platform.isAndroid();
      if (isAndroid) {
        $ionicLoading.hide();
        $scope.$broadcast('scroll.refreshComplete');
        window.location = "./index.html";
      }
    }

    if (Rendred) {
      $ionicLoading.hide();
    }

    reMenu.success(function(data, status, headers, config) {

      $ionicLoading.hide();
      $scope.$broadcast('scroll.refreshComplete');
      if (headers('msisdn_res') !== undefined && headers('msisdn_res') !== null && headers('msisdn_res') != null) {
        appSettings.config.MSISDN_VALUE = headers('msisdn_res');
      } else {
        if (data.msisdn !== undefined && data.msisdn !== null && data.msisdn != null) {
          appSettings.config.MSISDN_VALUE = data.msisdn;
        }
      }

      $scope.setMSISDN(appSettings.config.MSISDN_VALUE);

      var pinCodeStatus = PelApi.GetPinCodeStatus(data, "getMenu");
      if ("Valid" === pinCodeStatus) {

        appSettings.config.token = data.token;
        appSettings.config.user = data.user;
        appSettings.config.userName = data.userName;
        var strData = JSON.stringify(data);
        strData = strData.replace(/\"\"/g, null);
        strData = strData.replace(/"\"/g, "");
        appSettings.config.GetUserMenu = JSON.parse(strData);
        $scope.feeds_categories = appSettings.config.GetUserMenu;
        $scope.feeds_categories.menuItems = $scope.insertOnTouchFlag($scope.feeds_categories.menuItems);
        $sessionStorage.mainMenu = {
          token: appSettings.config.token,
          user: appSettings.config.GetUserMenu.user,
          userName: appSettings.config.GetUserMenu.userName,
          menuItems: appSettings.config.GetUserMenu,
          timeStamp: new Date().getTime()
        };
        //---------------------------------------------
        //-- Send User Tag for push notifications
        //---------------------------------------------
        if (window.plugins !== undefined) {
          window.plugins.OneSignal.sendTags({
            "User": data.userName,
            "Env": appSettings.env
          });
        }
        //--------------------------------------
        //  Save Important Data in session
        //--------------------------------------
        $sessionStorage.token = appSettings.config.token;
        $sessionStorage.user = appSettings.config.GetUserMenu.user;
        $sessionStorage.userName = appSettings.config.GetUserMenu.userName;

        appSettings.config.Pin = appSettings.config.GetUserMenu.PinCode;
        if (appSettings.config.PIN_CODE_AUTHENTICATION_REQUIRED_CODE === appSettings.config.Pin) {
          //Golan
          $state.go('app.login');

          /* PelApi.pinState.set({
            valid: false,
            code: appSettings.config.Pin,
            apiCode: pinCodeStatus
          })
          */
        } else {
          appSettings.config.Pin = appSettings.config.GetUserMenu.PinCode;
          appSettings.config.IS_TOKEN_VALID = "Y";
          //Golan
          PelApi.pinState.set({
            valid: true,
            code: appSettings.config.Pin,
            apiCode: pinCodeStatus
          })
          //----- Rem by R.W. 02/01/2016 after conference with Lina and Maya
          //$scope.setSettings();
        }

      } else if ("PAD" === pinCodeStatus) {

        if (appSettings.config.PIN_CODE_AUTHENTICATION_REQUIRED_CODE === appSettings.config.Pin) {
          $state.go('app.login');
        }

      } else if ("PCR" === pinCodeStatus) {
        errorMsg = appSettings.PIN_STATUS.PAD;
        //PelApi.showPopup(appSettings.config.pinCodeSubTitlePCR , "");
        appSettings.config.IS_TOKEN_VALID = "N";
        PelApi.goHome();
      } else if ("PWA" === pinCodeStatus) {
        appSettings.config.IS_TOKEN_VALID = "N";
        PelApi.goHome();
        //PelApi.showPopup(appSettings.config.pinCodeSubTitlePWA , "");
      } else if ("OLD" === pinCodeStatus) {
        PelApi.showPopupVersionUpdate(data.StatusDesc, "");
      }
    }).error(
      function(errorStr, httpStatus, headers, config) {
        var time = config.responseTimestamp - config.requestTimestamp;
        var tr = ' (TS  : ' + (time / 1000) + ' seconds)';

        PelApi.throwError("api-400", "GetUserMenu", "httpStatus : " + httpStatus + tr)
        //PelApi.showPopup(appSettings.config.getUserModuleTypesErrorMag, "");
      }
    ).finally(function() {
      $ionicLoading.hide();
      $scope.$broadcast('scroll.refreshComplete');
    });
  } //  GetUserMenuMain

  $scope.setMSISDN = function(pin) {

    try {
      var msisdn = window.localStorage.getItem("PELE4U_MSISDN");

      if (msisdn === undefined || msisdn === "") {
        window.localStorage.setItem("PELE4U_MSISDN", pin);
      } else if (msisdn !== pin) {
        window.localStorage.removeItem("PELE4U_MSISDN");
        window.localStorage.setItem("PELE4U_MSISDN", pin);
      } else {
        window.localStorage.setItem("PELE4U_MSISDN", pin);
      }
    } catch (e) {
      PelApi.lagger.error(" $scope.setMSISDN() - " + e);
    }
  }; // setMSISDN
  $scope.getMSISDN = function() {
    var value = window.localStorage.getItem("PELE4U_MSISDN");
    return value;
  } // getMSISDN

  /** *****************************************************************
   *  When         Who      Description
   *  -----------  -------  -------------------------------------------
   *  02/08/2016   R.W.
   *****************************************************************
   */
  $scope.doRefresh = function() {
    $scope.btn_class = {};
    $scope.btn_class.on_release = true;

    PelApi.showLoading();
    var errorMsg = "";

    $scope.isOnline = appSettings.config.isOnline;
    $scope.network = appSettings.config.network;

    //-------------------------------//
    //PelApi.setPELE4_SETTINGS_DIRECTORY();
    //-------------------------------//
    var continueFlag = "Y";

    if ("wifi" === appSettings.config.network) {
      appSettings.config.MSISDN_VALUE = $scope.getMSISDN();

      if (appSettings.config.MSISDN_VALUE === null) {
        PelApi.showPopup(appSettings.config.TITLE_WIFI_FIRST_CONNECTION_1, appSettings.config.TITLE_WIFI_FIRST_CONNECTION_2);
        $ionicLoading.hide();
        $scope.$broadcast('scroll.refreshComplete');
      } else {
        if (appSettings.config.IS_TOKEN_VALID !== "Y") {
          $scope.GetUserMenuMain();
        } else {
          $sessionStorage.token = appSettings.config.token;
          $sessionStorage.user = appSettings.config.GetUserMenu.user;
          $sessionStorage.userName = appSettings.config.GetUserMenu.userName;
          $scope.feeds_categories = appSettings.config.GetUserMenu;

          $ionicLoading.hide();
          $scope.$broadcast('scroll.refreshComplete');
        }
      }
    } else {
      appSettings.config.IS_TOKEN_VALID = "Y"
      $scope.GetUserMenuMain();
    }
  }
  //------------------------------------------------------
  //--                  Switch APP
  //------------------------------------------------------
  $scope.appSwitch = function(i) {

    var iabOptions = {
      location: 'yes',
      clearcache: 'yes',
      toolbar: 'yes'
    };

    var target = i.target || "_blank";
    if (i.url) {
      $cordovaInAppBrowser.open(i.url, target, iabOptions)
        .then(function(event) {
          // success
        }, function(event) {
          // error
        });
      return false;
    } else if (i.Path) {
      var path = i.Path; //"apps/" + i.Path + "/app.html";
      //window.location.href = path;
      $state.go(path, {
        "AppId": i.AppId,
        "Title": i.Title,
        "Pin": i.Pin
      });
      //$state.go("app.p2_test");

    }

  };
  //-----------------------------------------------------------//
  //--                 forwardToApp
  //-----------------------------------------------------------//
  $scope.forwardToApp = function(statePath, appId, titleDisp) {

    $sessionStorage.PeleAppId = appId;

    srvShareData.addData({
      "PeleNetwork": appSettings.config.network,
      "PeleMsisdnValue": appSettings.config.MSISDN_VALUE,
      "PeleAppId": appId
    });

    var i = {};
    i.Path = statePath;
    i.AppId = appId;
    i.Title = titleDisp;
    i.Pin = appSettings.config.Pin;

    $scope.appSwitch(i);

  };
  //-------------------------------//
  //--       Code Section        --//
  //-------------------------------//
  var btnClass = {};
  btnClass.activ = false;
  $scope.class = "pele-menu-item-on-touch item-icon-right";
  $scope.doRefresh();
})
