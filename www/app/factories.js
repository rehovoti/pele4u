angular.module('pele.factories', ['ngStorage', 'LocalStorageModule', 'ngCordova', 'pele.messages'])
  .factory('PelApi', function($cordovaFileTransfer, $cordovaNetwork, $ionicActionSheet, $http, $rootScope, appSettings, $state, $ionicLoading, $filter, $ionicPopup, $timeout, $fileLogger, $sessionStorage, $localStorage, $cordovaFile, messages) {
    var self = this;
    var _global = {};
    var network = {};
    return {

      getLocalStorageUsage: function() {
        var _lsTotal = 0,
          maxLen = 0,
          _xLen, _x, largestX;
        var localStorageKeys = {};
        for (var i = 0; i < localStorage.length; i++) {
          localStorageKeys[localStorage.key(i)] = 1;
        }

        for (_x in localStorageKeys) {
          _xLen = ((localStorage.getItem(_x).length + _x.length) * 2);
          if (_xLen > maxLen) {
            largestX = _x;
            maxLen = _xLen;
          }
          _lsTotal += _xLen;

        };
        var kb = (_lsTotal / 1024).toFixed(2);
        var mb = (kb / 1024).toFixed(2);
        return {
          kb: kb,
          mb: mb,
          largetKey: largestX,
          maxSize: (maxLen / (1024 * 1024)).toFixed(2)
        }
      },
      init: function() {
        this.global.set('debugFlag', appSettings.debug, true)

        this.messages = messages;
        this.appSettings = appSettings;
        this.topconfig = appSettings.apiConfig;
        this.env = appSettings.env;
        //file "located" in Borwser localStorage
        this.$fileLogger = $fileLogger;
        this.lagger = $fileLogger;

        this.sessionStorage = $sessionStorage;
        this.localStorage = $localStorage;

      },
      cordovaInit: function() {
        //file in device file system
        var self = this;
        self.isAndroid = ionic.Platform.isAndroid();
        self.isIOS = ionic.Platform.isIOS();
        appSettings.config.network = $cordovaNetwork.getNetwork();
        appSettings.config.isOnline = $cordovaNetwork.isOnline();
        network = {
          isOnline: $cordovaNetwork.isOnline(),
          network: $cordovaNetwork.getNetwork()
        };

        //$scope.$apply();


        // listen for Online event
        $rootScope.$on('$cordovaNetwork:online', function(event, networkState) {
          appSettings.config.isOnline = true;
          appSettings.config.network = $cordovaNetwork.getNetwork();
          network = {
            isOnline: true,
            network: $cordovaNetwork.getNetwork()
          };
          if (appSettings.env == "DV") {
            var alertPopup = $ionicPopup.alert({
              title: 'Network Changed',
              template: 'network - DEV only : ' + appSettings.config.network
            });
          }

          $rootScope.$apply();
        })

        // listen for Offline event
        $rootScope.$on('$cordovaNetwork:offline', function(event, networkState) {
          appSettings.config.isOnline = false;
          appSettings.config.network = $cordovaNetwork.getNetwork();
          network = {
            isOnline: false,
            network: $cordovaNetwork.getNetwork()
          };
          if (appSettings.env == "DV") {
            var alertPopup = $ionicPopup.alert({
              title: 'Network Changed',
              template: 'network - DEV only : ' + appSettings.config.network
            });
          }
          $rootScope.$apply();
        })

        self.lagger = $fileLogger;

        $fileLogger.setStorageFilename(appSettings.config.LOG_FILE_NAME);
        self.lagger.info('start new log');
        self.lagger.deleteLogfile().then(function() {
          $fileLogger.setStorageFilename(appSettings.config.LOG_FILE_NAME)
          self.lagger.info('Flush log ->  start new log');
        });
        self.registerPushNotification();
      },

      registerPushNotification: function() {
        //-----------------------------------------
        //--   Registration for Push Notification
        //-----------------------------------------
        var self = this;
        if (cordova.plugins && cordova.plugins.notification && cordova.plugins.notification.badge) {
          cordova.plugins.notification.badge.configure({
            autoClear: true
          });

          cordova.plugins.notification.badge.clear();

          self.lagger.info("Clean badges counter");
        }
        var oneSignalConf = appSettings.apiConfig.OneSignal[appSettings.apiConfig.env] || "notfound";
        if (oneSignalConf === "notfound") {
          self.throwError("client", "registerPushNotification", "Onesignal conf not found !", false);
        }

        self.lagger.info('Open Notification Event');
        window.plugins.OneSignal.setLogLevel({
          logLevel: oneSignalConf.logLevel || 0,
          visualLevel: oneSignalConf.visualLevel || 0
        });
        var notificationOpenedCallback = function(jsonData) {
          self.lagger.info('notificationOpenedCallback: ', jsonData);
        };
        window.plugins.OneSignal
          //.startInit(conf.appId, conf.googleProjectNumber)
          .startInit(oneSignalConf.appId)
          .inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.Notification)
          .handleNotificationOpened(notificationOpenedCallback)
          .endInit();

        window.plugins.OneSignal.getIds(function(ids) {
          appSettings.config.PLAYER_ID = ids.userId;
          self.lagger.info('window.plugins.OneSignal.getIds :' + ids.userId);
        });

      },

      sendPincode: function(pincode) {
        return $http({
          url: appSettings.api,
          method: "POST",
          data: {
            pincode: pincode
          },
          timeout: appSettings.timeout,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      },
      login: function() {
        return $http({
          url: appSettings.api,
          method: "POST",
          data: {},
          timeout: appSettings.timeout,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      },
      getAppId: function() {

        var menuList = appSettings.config.GetUserMenu;

        var pinCodeReq = "N";
        var appId = "";

        if (menuList.menuItems !== undefined) {
          var appList = menuList.menuItems;
          var length = appList.length;

          for (var i = 0; i < length; i++) {
            var pin = appList[i].Pin
            if (pin !== false) {
              pinCodeReq = "Y";
              appId = appList[i].AppId;
              i = length;
            }
          }
          try {
            if (appId === "") {
              appId = appList[0].AppId;
            }
          } catch (e) {
            appId = appSettings.config.appId;
          }
        }
        return appId;
      },
      sendScanPrint: function(links) {
        var headers = {
          "Accept": "application/json, text/plain, */*"
        };
        var version = appSettings.config.APP_VERSION;
        //{"Content-Type": "application/json; charset=utf-8"};
        var envUrl = links + "&UserName=" + appSettings.config.userName + "&ID=" + appSettings.config.user;

        if ("wifi" === network.network) {
          var msisdn = appSettings.config.MSISDN_VALUE || $localStorage.PELE4U_MSISDN;
          if (!msisdn) msisdn = $sessionStorage.PELE4U_MSISDN;
          if (!msisdn) {
            self.lagger.error("Service:ScanPrint cant find msisdn ! not in config or localStorage or sessionStorage")
          }


          headers = {
            "Content-Type": "application/json; charset=utf-8",
            "VERSION": version,
            "msisdn": msisdn
          }
        } else {
          headers = {
            "Content-Type": "application/json; charset=utf-8",
            "VERSION": version
          };
        }

        return $http({
          url: envUrl,
          method: "GET",
          timeout: appSettings.menuTimeout,
          headers: headers
        });
      },
      //--------------------------------------------------------------------------//
      //--                       IsSessionValidJson                             --//
      //--------------------------------------------------------------------------//
      IsSessionValidJson: function(links, appId, pin) {
        var envUrl = links.URL;
        var headers = "";
        var version = appSettings.config.APP_VERSION
        var parameters = "/" + appSettings.config.token + "/" + appId + "/" + pin;
        if ("wifi" === network.network) {
          var msisdn = appSettings.config.MSISDN_VALUE || $localStorage.PELE4U_MSISDN;
          if (!msisdn) msisdn = $sessionStorage.PELE4U_MSISDN;
          if (!msisdn) {
            self.lagger.error("Service:ScanPrint cant find msisdn ! not in config or localStorage or sessionStorage")
          }

          envUrl = links.url + parameters;
          headers = {
            "Content-Type": "application/json; charset=utf-8",
            "VERSION": version,
            "msisdn": msisdn
          }
        } else {
          envUrl = links.URL + parameters;
          headers = {
            "Content-Type": "application/json; charset=utf-8",
            "VERSION": version
          };
        }

        return $http({
          url: envUrl,
          method: "GET",
          timeout: appSettings.menuTimeout,
          headers: headers
        });
      },
      //--------------------------------------------------------------------//
      //                    GetUserMenu PAGE 1                              //
      //--------------------------------------------------------------------//
      getMenu: function(links) {
        var self = this;
        // LOADING

        var retry = links.retry || 0;
        if (network.network === "wifi") {
          retry = 0;
        }
        return $http({
          url: links.url,
          method: "GET",
          timeout: links.timeout || appSettings.menuTimeout,
          retry: retry,
          headers: links.headers
        });

      },
      //------------------------------------------------------------------------//
      //                        getUserModuleTypes PAGE 2                       //
      //------------------------------------------------------------------------//
      getUserModuleTypes: function(links, appId, pin) {

        var token = appSettings.config.token;
        var userName = appSettings.config.userName;

        var RequestHeader = links.RequestHeader;
        var data = {
          "Request": {
            "RequestHeader": RequestHeader,
            "InParams": {
              "Token": token,
              "AppId": appId,
              "PIN": pin,
              "UserName": userName
            }
          }
        };

        return $http({
          url: links.url,
          method: "POST",
          data: data,
          timeout: links.timeout || appSettings.defaultHttpTimeout,
          retry: links.retry || 0,
          headers: links.headers
        });
      },
      //--------------------------------------------------------------------------//
      //--                       GetUserFormGroups  PAGE3                       --//
      //--------------------------------------------------------------------------//
      GetUserFormGroups: function(links, appId, formType, pin) {

        var token = appSettings.config.token;
        var userName = appSettings.config.userName;


        var RequestHeader = links.RequestHeader;
        var data = {
          "Request": {
            "RequestHeader": RequestHeader,
            "InParams": {
              "Token": token,
              "AppId": appId,
              "PIN": pin,
              "UserName": userName,
              "FormType": formType
            }
          }
        };

        return $http({
          url: links.url,
          method: "POST",
          data: data,
          retry: links.retry || 0,
          timeout: links.timeout || appSettings.defaultHttpTimeout,
          headers: links.headers
        });
      },
      //--------------------------------------------------------------
      //--      REQ P3
      //--------------------------------------------------------------
      GetUserRqGroups: function(links, appId, formType, pin) {


        var token = appSettings.config.token;
        var userName = appSettings.config.userName;

        var RequestHeader = links.RequestHeader;
        var data = {
          "Request": {
            "RequestHeader": RequestHeader,
            "InParams": {
              "Token": token,
              "AppId": appId,
              "PIN": pin,
              "UserName": userName,
              "FormType": formType
            }
          }
        };

        return $http({
          url: links.url,
          method: "POST",
          retry: links.retry || 0,
          data: data,
          timeout: links.timeout || appSettings.defaultHttpTimeout,
          headers: links.headers
        });
      },
      //--------------------------------------------------------------------------//
      //--                       GetUserNotifications  PAGE4                    --//
      //--------------------------------------------------------------------------//
      GetUserNotifications: function(links, appId, docId, docInitId) {
        var token = appSettings.config.token;
        var userName = appSettings.config.userName;
        var RequestHeader = links.RequestHeader;
        var data = {
          "Request": {
            "RequestHeader": RequestHeader,
            "InParams": {
              "Token": token,
              "AppId": appId,
              "PIN": "0",
              "UserName": userName,
              "DocId": docId,
              "DocInitId": docInitId
            }
          }
        };

        return $http({
          url: links.url,
          method: "POST",
          data: data,
          retry: links.retry || 0,
          timeout: links.timeout || appSettings.defaultHttpTimeout,
          headers: links.headers
        });

      },
      //--------------------------------------------------------------------------//
      //--                       SubmitNotification  PAGE4                      --//
      //--------------------------------------------------------------------------//
      SubmitNotification: function(links, appId, notificationId, note, actionType) {
        var token = appSettings.config.token;
        var userName = appSettings.config.userName;

        if (note != undefined && note != null) {
          note = note.replace(/[^\w\d\s\א-ת\(\)\@]/g, " ");
        }



        var RequestHeader = links.RequestHeader;

        var data = {
          "Request": {
            "RequestHeader": RequestHeader,
            "InParams": {
              "Token": token,
              "AppId": appId,
              "PIN": "0",
              "UserName": userName,
              "NotificationId": notificationId,
              "Note": note,
              "ActionType": actionType
            }
          }
        };

        return $http({
          url: links.url,
          method: "POST",
          data: data,
          timeout: links.timeout || appSettings.defaultHttpTimeout,
          headers: links.headers
        });
      },
      //--------------------------------------------------------------------------//
      //--                       GetFileURI  PAGE_PO4 ATTACHMENTS               --//
      //--------------------------------------------------------------------------//
      GetFileURI: function(links, appId, pin, fileOrFolder) {


        var token = appSettings.config.token;
        var userName = appSettings.config.userName;

        var RequestHeader = links.RequestHeader;
        var data = {
          "Request": {
            "RequestHeader": RequestHeader,
            "InParams": {
              "Token": token,
              "AppId": appId,
              "PIN": pin,
              "UserName": userName,
              "FileOrFolder": fileOrFolder
            }
          }
        };

        return $http({
          url: links.url,
          method: "POST",
          data: data,
          retry: links.retry || 0,
          timeout: links.timeout || appSettings.defaultHttpTimeout,
          headers: links.headers
        });
      }, // End GetFileURI

      //--------------------------------------------------------------------------//
      //--                       GetUserPoOrdGroupGroup  PAGE_PO3                       --//
      //--------------------------------------------------------------------------//
      GetUserPoOrdGroupGroup: function(links, appId, formType, pin) {


        var token = appSettings.config.token;
        var userName = appSettings.config.userName;


        var RequestHeader = links.RequestHeader;
        var data = {
          "Request": {
            "RequestHeader": RequestHeader,
            "InParams": {
              "Token": token,
              "AppId": appId,
              "PIN": pin,
              "UserName": userName,
              "FormType": formType
            }
          }
        };

        return $http({
          url: links.url,
          method: "POST",
          data: data,
          retry: links.retry || 0,
          timeout: links.timeout || appSettings.defaultHttpTimeout,
          headers: links.headers
        });

      },

      throwError: function(category, from, errorString, redirectInd) {
        var self = this;
        var redirect = redirectInd || true;
        if (category.match(/api|eai|app/i)) {
          errorString = "API request " + from + " endedd with failure : " + errorString;
        }

        var lastError = {
          state: $state.current.name,
          created: new Date(),
          network: network.network,
          category: category,
          from: from,
          description: errorString,
          redirect: redirect
        };

        var debugFlag = self.global.get('debugFlag');
        self.$fileLogger.error("-------------- START ERROR SECTION  ------------------");
        if (!debugFlag || debugFlag === undefined) {
          var lastStateChangeStart = self.global.get('lastStateChangeStart');
          var lastStateChangeError = self.global.get('lastStateChangeError');
          var lastApiResponse = self.global.get('lastApiResponse');
          var lastApiRequestConfig = self.global.get('lastApiRequestConfig');
          if (lastStateChangeStart)
            self.$fileLogger.error("lastStateChangeStart:", lastStateChangeStart);
          if (lastStateChangeError)
            self.$fileLogger.error("lastStateChangeError:", lastStateChangeError);
          if (lastApiResponse)
            self.$fileLogger.error("lastApiResponse:", lastApiResponse);
          if (lastApiRequestConfig)
            self.$fileLogger.error("lastApiRequestConfig:", lastApiRequestConfig);
        }
        self.$fileLogger.error(lastError);
        self.$fileLogger.error("-------------- END ERROR SECTION  ------------------");
        var errStr = "";
        Object.keys(lastError).forEach(function(k) {
          errStr += k + ":" + lastError[k] + "\n\r";
        })

        if (typeof $localStorage.appErrors === "undefined") {
          $localStorage.appErrors = []
        }
        var errorsArr = $localStorage.appErrors;

        errorsArr.push(lastError);

        $localStorage.appErrors = _.slice(errorsArr, Math.max(errorsArr.length - 10, 0))
        self.lagger.error(errStr);

        var message = errorString;
        if (category.match(/api|eai|app/i)) {
          message = "API request " + from + " endedd with failure : " + errorString;
        }
        if (redirect) {
          $state.go("app.error", {
            error: lastError
          })
        }
      },

      getApiStatus: function(data, interface) {
        var stat = {
          status: "",
          description: ""
        };


        //First check EAI ResponseHeader
        var eaiStatus = _.get(data, "Response.ResponseHeader.EAI_Status");
        var SessionStatus = _.get(data, "Response.OutParams.SessionStatus");

        if (eaiStatus && eaiStatus != "0") {
          return {
            status: "EAI_ERROR",
            description: "EAI ResponseHeader return with error : "
          }
        }
        // Then we check EAI OutParams (Application error)
        var P_ERROR_CODE = _.get(data, "Response.OutParams.P_ERROR_CODE", "").toString();
        var P_ERROR_DESC = _.get(data, "Response.OutParams.P_ERROR_DESC");
        var AppErrorCode = _.get(data, "Response.OutParams.ErrorCode", "").toString();
        var AppErrorDesc = _.get(data, "Response.OutParams.ErrorDesc");

        if (P_ERROR_CODE && P_ERROR_CODE != "0") {
          return {
            status: "ERROR_CODE",
            description: P_ERROR_DESC
          }
        }

        if (AppErrorCode && AppErrorCode != "0") {
          return {
            status: "APP_ERROR_CODE",
            description: AppErrorDesc
          }
        }

        // then check specical return data from getMenu API
        if ("getMenu" === interface) {
          stat.status = data.Status;
          if ("OLD" !== stat.status && "PAD" !== stat.status) {
            stat.status = "Valid";
          }
          return stat;
        }

        // Then we check if session is Invalid for All other API-s
        //By default  if we reached here and SessionStatus is undefined - we assume it "Valid" --- aaahhhaaa

        stat.status = _.get(data, "Response.OutParams.SessionStatus", "Valid");
        return stat;
      },

      checkApiResponse: function(data, interface) {
        var self = this;
        var apiStat = self.getApiStatus(data, interface);
        var pinStatus = apiStat.status;

        if (pinStatus == "Valid") {
          var result = _.get(data, "Response.OutParams", []);
          return result;
        } else if (pinStatus === "PDA") {
          $state.go("app.login");
        } else if ("InValid" === pinStatus && "EOL" === pinStatus) {
          appSettings.config.IS_TOKEN_VALID = "N";
          self.throwError("app", "checkApiResponse", "Invalid token , status :" + pinStatus)
        } else if ("EAI_ERROR" === pinStatus) {
          self.throwError("eai", "checkApiResponse", apiStat.description)
        } else if ("ERROR_CODE" === pinStatus) {
          self.throwError("app", "checkApiResponse", apiStat.description)
        } else if ("APP_ERROR_CODE" === pinStatus) {
          self.throwError("app", "checkApiResponse", apiStat.description)
        }

        apiStat.error = true;
        return apiStat;
      },
      //-----------------------------------------------------------------------------//
      //--                      GetPinCodeStatus                                   --//
      //-----------------------------------------------------------------------------//
      GetPinCodeStatus2: function(data, interface) {
        var stat = {
          status: "",
          description: ""
        };
        //------------------------------------
        //-- Check EAI Status
        //------------------------------------
        if ("SubmitNotif" === interface) {
          var eaiStatus_SubmitNotif = undefined;
          var SessionStatus_SubmitNotif = undefined;
          var P_ERROR_CODE = undefined;
          var P_ERROR_DESC = undefined;

          //-- Get EAI_Status --//
          try {
            eaiStatus_SubmitNotif = data.Response.ResponseHeader.EAI_Status;
          } catch (e) {
            eaiStatus_SubmitNotif = undefined;
          }



          //-- Get SessionStatus -- //
          try {
            SessionStatus_SubmitNotif = data.Response.OutParams.SessionStatus
          } catch (e) {
            SessionStatus_SubmitNotif = undefined;
          }

          //-- Get P_ERROR_CODE & P_ERROR_DESC -- //
          try {
            P_ERROR_CODE_SubmitNotif = data.Response.OutParams.P_ERROR_CODE;
            P_ERROR_DESC_SubmitNotif = data.Response.OutParams.P_ERROR_DESC;
          } catch (e) {
            P_ERROR_CODE_SubmitNotif = undefined;
            P_ERROR_DESC_SubmitNotif = undefined;
          }

          if ("0" !== eaiStatus_SubmitNotif && eaiStatus_SubmitNotif !== undefined) {
            stat.status = "EAI_ERROR";
          } else if (0 !== P_ERROR_CODE_SubmitNotif && undefined !== P_ERROR_CODE_SubmitNotif) {
            stat.status = "ERROR_CODE";
            stat.description = P_ERROR_DESC_SubmitNotif;
          } else {
            stat.status = data.Response.OutParams.SessionStatus;
          }
        } else {
          var eaiStatus = data.Response.ResponseHeader.EAI_Status;
          if ("0" !== eaiStatus && undefined !== eaiStatus) {
            stat.status = "EAI_ERROR";
          } else {
            try {
              var SessionStatus = data.Response.OutParams.SessionStatus;

              if ("InValid" === SessionStatus && SessionStatus != undefined) {
                stat.status = "InValid";
                return stat;
              }
              var errorCode = data.Response.OutParams.P_ERROR_CODE;
              var errorDesc = data.Response.OutParams.P_ERROR_DESC;
              if (undefined !== errorCode) {
                errorCode = errorCode.toString();
              } else {
                errorCode = "0";
              }

              if ("0" !== errorCode) {
                stat.status = "ERROR_CODE";
                stat.description = errorDesc;
              } else {
                if ("getMenu" === interface) {
                  stat.status = data.Status;
                  if ("OLD" === status.status) {
                    return stat;
                  }
                  if ("PAD" !== stat) {
                    stat.status = "Valid";
                  }
                } else if ("getUserModuleTypes" === interface ||
                  "GetUserFormGroups" === interface ||
                  "GetUserPoOrdGroupGroup" === interface ||
                  "GetUserNotif" === interface ||
                  "GetUserNotifications" === interface ||
                  "SubmitNotif" === interface ||
                  "IsSessionValidJson" === interface ||
                  "GetUserPoOrdGroupGroup" === interface ||
                  "GetUserNotifNew" === interface
                ) {
                  if (undefined !== data.Response.OutParams.SessionStatus) {
                    stat.status = data.Response.OutParams.SessionStatus;
                  } else {
                    stat.status = "Valid";
                  }
                }

              }
            } catch (e) {
              stat.status = "Valid";
            }
          }
        }
        return stat;
      },
      //-----------------------------------------------------------------------------//
      //--                      GetPinCodeStatus                                   --//
      //-----------------------------------------------------------------------------//
      GetPinCodeStatus: function(data, interface) {
        var status = "";
        try {
          if ("getMenu" === interface) {
            status = data.Status;
            if ("OLD" === status) {
              return status;
            }
            if ("PAD" !== status) {
              status = "Valid"
            }
          } else if ("getUserModuleTypes" === interface || "GetUserFormGroups" === interface) {
            status = data.Response.OutParams.SessionStatus;
          }
        } catch (e) {
          status = "Valid";
        }
        return status;
      },
      //--------------------------------------------------------------------------------//
      //--                       PincodeAction                                        --//
      //--------------------------------------------------------------------------------//
      PincodeAction: function(pinRetValue) {
        if ("EOL" === pinRetValue) {

        }
        if ("PAD" === pinRetValue) {

        }
        if ("PWA" === pinRetValue) {

        }
        if ("NRP" === pinRetValue) {

        }
        if ("PNE" === pinRetValue) {

        }
        if ("PCR" === pinRetValue) {
          appSettings.config.pinCodeErrorInd = "N";
          $state.go(auth.login);
        }
        if ("Invalid" === pinRetValue) {

        }
        if ("Valid" === pinRetValue) {

        }
      }, // PincodeAction
      //----------------------------------------------------------//
      //--                    GetServiceUrl                     --//
      //----------------------------------------------------------//
      getDocApproveServiceUrl: function(serviceName) {
        var self = this;
        var serviceConf = appSettings.apiConfig.services[serviceName];
        if (!serviceConf || serviceConf == undefined) {

          self.lagger.error("No service conf found : " + serviceName);
          return serviceConf;
        }

        var headers = {
          "Content-Type": "application/json; charset=utf-8",
          "VERSION": appSettings.config.APP_VERSION
        };


        if ("wifi" === network.network) {
          var msisdn = appSettings.config.MSISDN_VALUE || $localStorage.PELE4U_MSISDN;
          if (!msisdn) msisdn = $sessionStorage.PELE4U_MSISDN;
          if (!msisdn) {
            self.lagger.error("Service:" + serviceName + " cant find msisdn ! not in config or localStorage or sessionStorage")

          }

          headers.msisdn = msisdn;
          serviceConf.url = appSettings.apiConfig.wifi_uri + serviceConf.endpoint;
        } else {
          serviceConf.url = appSettings.apiConfig.uri + serviceConf.endpoint;
        }
        serviceConf.headers = headers;
        return serviceConf;
      },
      //===========================================================//
      //==               Update Version                          ==//
      //===========================================================//
      showPopupVersionUpdate: function(title, subTitle) {
        $rootScope.data = {}

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
          title: title, //'WI-FI נא לסגור',
          subTitle: subTitle, //
          scope: $rootScope,
          buttons: [{
            text: '<a class="pele-popup-positive-text-collot">אישור</a>',
            type: 'button-positive',
            onTap: function(e) {
              var isIOS = ionic.Platform.isIOS();
              var isAndroid = ionic.Platform.isAndroid();
              if (isAndroid) {
                window.open(appSettings.config.GOOGLE_PLAY_APP_LINK, '_system', 'location=yes');
              } else if (isIOS) {
                window.open(appSettings.config.APPLE_STORE_APP_LING, '_system', 'location=yes');
              }
              return true;
            }
          }, ]
        });
        myPopup.then(function(res) {

        });

      },
      //----------------------------------------------------------//
      //                   WI_FI Pop Up
      //----------------------------------------------------------//
      showPopup: function(title, subTitle) {
        $rootScope.data = {}

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
          title: title, //'WI-FI נא לסגור',
          subTitle: subTitle, //
          scope: $rootScope,
          buttons: [{
            text: '<a class="pele-popup-positive-text-collot">אישור</a>',
            type: 'button-positive',
            onTap: function(e) {
              return true;
            }
          }, ]
        });
        return myPopup;

      },
      //===========================================================//
      //==                Pin Code PopUp                         ==//
      //===========================================================//
      showPinCode: function(appId, titleDisp, subTitleTxt) {
        $rootScope.data = {}

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
          template: '<input type="tel" ng-model="data.pincode" maxlength="4">',
          title: 'הזינו קוד מחמיר',
          subTitle: subTitleTxt,
          scope: $rootScope,
          buttons: [{
              text: '<a class="pele-popup-positive-text-collot">אישור</a>',
              type: 'button-positive',
              onTap: function(e) {
                if (!$rootScope.data.pincode) {
                  //don't allow the user to close unless he enters wifi password
                  e.preventDefault();
                } else {
                  var pin = $rootScope.data.pincode;
                  $state.go("app.p2_moduleList", {
                    "AppId": appId,
                    "Title": titleDisp,
                    "Pin": pin
                  });
                  return $rootScope.data.pincode;
                }
              }
            },
            {
              text: '<a class="pele-popup-positive-text-collot">ביטול</a>',
              type: 'button-assertive'
            },
          ]
        });
        myPopup.then(function(res) {

        });
      },
      //====================================================//
      //==            Show Loading                        ==//
      //====================================================//
      showLoading: function(options) {
        // you can configure default ionicLoadingConfig in  config.js   file
        $ionicLoading.show(options);
      },
      hideLoading: function() {
        $ionicLoading.hide();
      },
      //===========================================================================================//
      //== When         Who       Description
      //== -----------  --------  ----------------------------------------------------------------
      //== 06/01/2015   R.W.      function calculate list Action Buttons Display in Approve page
      //===========================================================================================//
      getButtons: function(buttonsArr) {

        var buttons = [];
        buttonsArr.forEach(function(b) {

          if (b.DISPLAY_FLAG !== "N" && appSettings[b.LOOKUP_CODE])
            buttons.push(appSettings[b.LOOKUP_CODE]);
        })
        return buttons;
      },

      logger: function() {
        //$fileLogger.setStorageFilename(appSettings.config.LOG_FILE_NAME);
        return $fileLogger;
      },

      goHome: function() {
        //window.location = "./../../index.html" ;
        $state.go("app.p1_appsLists");
      },
      goLogIn: function() {
        $state.go("app.login");
      },
      showIconCollapseInAcctionHistory: function(showFlag, hidenFlag) {
        var retVal = "";
        if (hidenFlag === true) {
          retVal = "";
        } else if (showFlag === true) {
          retVal = "icon-collapse";
        } else if (showFlag === false) {
          retVal = "icon-expand";
        }

        return retVal;

      },


      getAttchDirectory: function() {
        var retVal = "";
        var platformPath = "";

        if (!window.cordova) return false;

        if (ionic.Platform.isIOS()) {
          platformPath = cordova.file.dataDirectory;
        } else if (ionic.Platform.isAndroid()) {
          platformPath = cordova.file.externalApplicationStorageDirectory
        }

        retVal = platformPath + appSettings.config.ATTACHMENT_DIRECTORY_NAME;

        return retVal;
      },

      deleteAttachDirecoty: function() {
        var self = this;
        if (!window.cordova) return false;

        var platform = ionic.Platform.platform();
        var platformPath = "";
        if (ionic.Platform.isIOS()) {
          platformPath = cordova.file.dataDirectory;
        } else if (ionic.Platform.isAndroid()) {
          platformPath = cordova.file.externalApplicationStorageDirectory
        }
        self.lagger.info("platformPath: " + platformPath)
        $cordovaFile.checkDir(platformPath, appSettings.config.ATTACHMENT_DIRECTORY_NAME)
          .then(function(success) {
            // success
            var filePath = platformPath + appSettings.config.ATTACHMENT_DIRECTORY_NAME;

            $cordovaFile.removeRecursively(platformPath, appSettings.config.ATTACHMENT_DIRECTORY_NAME)
              .then(function(success) {
                // successdd
                $cordovaFile.createDir(platformPath, appSettings.config.SETTINGS_DIRECTORY_NAME, false)
                  .then(function(success) {
                    // success
                  }, function(error) {
                    // error
                  });
              }, function(error) {
                // error
              });
          }, function(error) {
            // error
            if (error.message === "NOT_FOUND_ERR") {
              $cordovaFile.createDir(platformPath, appSettings.config.ATTACHMENT_DIRECTORY_NAME, true)
                .then(function(success) {
                  // success
                }, function(error) {
                  // error
                });
            }
          });

      },
      replaceSpecialChr: function(data) {
        if (data != undefined && data != null) {
          data = data.replace(/[^\w\d\s\א-ת\(\)\@]/g, " ");
          //data = data.replace(/[\\]/g, '\\\\');
          //data = data.replace(/[\/]/g, '\\/');
          //data = data;
        }
        return data;
      },
      checkResponceStatus: function(data) {

        var retVal = {};

        var EAI_Status = data.Response.ResponseHeader.EAI_Status;
        var Application_Status = data.Response.ResponseHeader.Application_Status;
        var StatusCode = data.Response.OutParams.Status.StatusCode;
        var SessionStatus = data.Response.OutParams.SessionStatus;

        retVal.Status = "S";

        if ("0" !== EAI_Status) {
          retVal.Status = "EAI_Status";
          return;
        }

        if ("S" !== Application_Status) {
          retVal.Status = "Application_Status";
          return retVal;
        }

        if ("0" !== StatusCode) {
          retVal.Status = "StatusCode";
          return retVal;
        }

        if ("Valid" !== SessionStatus) {
          retVal.Status = SessionStatus;
          return retVal;
        }

        retVal.URL = data.Response.OutParams.URI;
        return retVal;
      },

      getChevronIcon: function(flag) {
        var ret_val;
        if (flag) {
          ret_val = "ion-chevron-left";
        } else {
          ret_val = "ion-chevron-down";
        }
      },


      //------------------------------------------------------------//
      //--                  getAttachedDocuments
      //------------------------------------------------------------//
      getAttachedDocuments: function(arr) {
        var myArr = [];
        for (var i = 0; i < arr.length; i++) {

          if (arr[i].DISPLAY_FLAG_1 === "Y") {
            var file_name = "";

            file_name = arr[i].FILE_NAME_3;

            var mayObj = {
              "SEQ": i,
              "CATEGORY_TYPE": arr[i].CATEGORY_TYPE_4,
              "DOCUMENT_ID": arr[i].DOCUMENT_ID_2,
              "FILE_NAME": file_name,
              "FILE_MAOF_TYPE": arr[i].FILE_TYPE_6,
              "FILE_TYPE": arr[i].FILE_TYPE_9,
              "FULL_FILE_NAME": arr[i].FULL_FILE_NAME_8,
              "OPEN_FILE_NAME": "/My Files &amp; Folders/" + arr[i].OPEN_FOLDER_5 + '/' + arr[i].FULL_FILE_NAME_8,
              //"SHORT_TEXT"               : arr[i].SHORT_TEXT_7,
              //"LONG_TEXT"                : arr[i].LONG_TEXT_VALUE_11,
              "IS_FILE_OPENED_ON_MOBILE": arr[i].IS_FILE_OPENED_ON_MOBILE_10,
              "IOS_OPEN_FILE_NAME": "/My Files &amp; Folders/" + arr[i].OPEN_FOLDER_5 + '/' + arr[i].IOS_FILE_NAME_12
            }

            myArr.push(mayObj);

          } // if

        } // for

        return myArr;
      },

      /*****************************************************************
        function : getJsonString
        parameters :
        string : The Json string to be parse
        path : a path of resolved keys .. e,g "stodents[0].info"
        redirect : bollean , true -> redirect to error page else return undefined
      */

      getJsonString: function(string, path, redirect) {
        var self = this;
        var jsVar = self.jsonParse(string, redirect)
        if (typeof jsVar == "undefined")
          return undefined;
        var subJsVar = _.get(jsVar, path);
        if (typeof subJsVar === "undefined" && redirect) {
          subJsVar = {};
          self.throwError("api", "getJsonString", "Failed to parse  JSON  string :" + string, redirect)
        }
        return subJsVar;
      },

      jsonParse: function(str, redirect) {
        var self = this;
        if (typeof redirect == "undefined")
          redirect = true;
        var jsVar;
        try {
          jsVar = JSON.parse(str);
        } catch (e) {
          if (redirect)
            self.throwError("api", "jsonParse", "Failed to parse  JSON  string :" + str, redirect)
          else
            self.lagger.error("Failed to parse  JSON  string   : " + str)
          return undefined;
        }
        return jsVar;
      },

      extendActionHistory: function(doc) {
        if (!doc.ACTION_HISTORY) return [];
        doc.ACTION_HISTORY.forEach(function(action) {
          action.display = false;
          action.right_icon = "";
          action.left_icon = "";

          if (typeof action.NOTE != "undefined" && action.NOTE.length) {
            action.display = true;
            action.left_icon = 'ion-chevron-down';
            if (action.ACTION_CODE == "REJECT") {
              action.right_icon = 'ion-close-circled red';
            }
          }
          if (action.ACTION_CODE === "FORWARD" || action.ACTION_CODE === "APPROVE") {
            action.left_icon = 'ion-chevron-left';
            action.right_icon = 'ion-checkmark-circled'
          }
          if (action.ACTION_CODE === "NO_ACTION") {
            action.left_icon = 'ion-chevron-left';
            action.right_icon = 'ion-minus-circled';
          }
          if (action.ACTION_CODE === "WAITING") {
            action.short_text = 'ממתין';
            action.right_icon = 'ion-clock navy';
          }
          if (!action.ACTION_CODE && action.NOTE) {
            action.display = false;
            action.left_icon = 'ion-chevron-left';
            action.short_text = action.NOTE;
          }
          if (!action.ACTION_CODE && !action.NOTE) {
            action.display = false;
            action.right_icon = "";
            action.left_icon = "";
          }
        })
      },
      showBtnActions: function(scope, butttons) {
        var self = this;
        var buttons = self.getButtons(butttons);
        var hideSheet = $ionicActionSheet.show({
          buttons: buttons,
          titleText: 'רשימת פעולות עבור טופס',
          cancelText: 'ביטול',
          cancel: function() {
            return true;
          },
          buttonClicked: function(index, button) {
            scope.updateDoc(buttons[index]);
            return true;
          },
        });
      },

      getErrorsStack: function() {
        return _.reverse(($localStorage.appErrors || []))
      },
      global: {
        getall: function() {
          return _global;
        },
        get: function(varname, storageInd, defvalue) {
          storageInd = storageInd || true;

          if (typeof _global[varname] !== "undefined") {
            return _global[varname];
          }
          if (storageInd && $localStorage._global && $localStorage._global[varname] !== "undefined") {
            _global[varname] = $localStorage._global[varname]
            return _global[varname]
          }
          if (defvalue) {
            return defvalue;
          } else {
            return undefined
          }

        },
        set: function(varname, newval, storageInd) {
          storageInd = storageInd || true;
          _global[varname] = newval;
          if (storageInd) {
            $localStorage[varname] = newval;
          }
          return true;
        },
        clear: function(varname) {
          delete _global[varname]
          delete $localStorage[varname]
          return true;
        }
      },
      pinState: {
        get: function() {
          if (typeof this.pinStateData !== "undefined") {
            return this.pinStateData;
          }
          if (typeof $localStorage.pinStateData !== "undefined") {
            this.pinStateData = $localStorage.pinStateData
            return this.pinStateData;
          }

          $localStorage.pinStateData = {
            valid: false,
            code: ""
          }
          this.pinStateData = $localStorage.pinStateData;
        },
        set: function(newState) {
          this.pinStateData = newState;
          $localStorage.pinStateData = newState;
        },
        clear: function() {
          this.pinStateData = undefined;
          $localStorage.pinStateData = undefined;
        }
      },
      openAttachment: function(file, appId) {

        var spinOptions = {
          delay: 0,
          template: '<div class="text-center">המתינו לפתיחת הקובץ' +
            '<br \><img ng-click="stopLoading()" class="spinner" src="./img/spinners/puff.svg">' +
            '</div>',
        };

        appId = appId || "123456";
        openDoc = function(url, target, propsStr) {
          var myPopup = window.open(url, target, propsStr);
          myPopup.addEventListener('loadend', function() {
            self.hideLoading();
          }, false);
        }
        var self = this;


        var timeoutFunction = function() {
          $ionicLoading.hide();
          $rootScope.$broadcast('scroll.refreshComplete');
          self.showPopup(self.appSettings.config.FILE_TIMEOUT, "");
        };

        if (file.SHOW_CONTENT !== 'Y') {
          self.showPopup(self.appSettings.config.ATTACHMENT_TYPE_NOT_SUPORTED_FOR_OPEN, "");
          return true;
        }
        var links = self.getDocApproveServiceUrl("GetFileURI");
        self.showLoading(spinOptions);

        var pinCode = self.pinState.get().code;
        var full_path = self.appSettings.shareFileDirectory + file.TARGET_PATH + "/" + file.TARGET_FILENAME;

        var getFilePromise = self.GetFileURI(links, appId, self.pinState.get().code, full_path);
        getFilePromise.success(function(data) {
          self.showLoading(spinOptions);
          var fileApiData = self.checkApiResponse(data);

          if (typeof fileApiData.URI === "undefined" || !fileApiData.URI) {
            self.hideLoading();
            self.showPopup(self.appSettings.config.FILE_NOT_FOUND, "");
            return false;
          }

          targetPath = self.getAttchDirectory() + '/' + file.TARGET_FILENAME;
          var docWindow;
          if (!window.cordova) {
            self.showPopup("הקובץ ירד לספריית ההורדות במחשב זה", "");
            openDoc(fileApiData.URI, "_system", "location=yes,enableViewportScale=yes,hidden=no");
          } else if (self.isIOS) {
            openDoc(fileApiData.URI, "_system", "charset=utf-8,location=yes,enableViewportScale=yes,hidden=no");
          } else if (self.isAndroid) {
            var filetimeout = $timeout(timeoutFunction, appSettings.config.ATTACHMENT_TIME_OUT);

            $cordovaFileTransfer.download(fileApiData.URI, targetPath, {}, true)
              .then(
                //success
                function(result) {
                  $timeout.cancel(filetimeout);
                  if (!result.nativeURL) {
                    self.hideLoading();
                    self.throwError("api", "cordovaFileTransfer.download", JSON.stringify(result), false);
                  } else {
                    openDoc(result.nativeURL, "_system", "location=yes,enableViewportScale=yes,hidden=no");
                  }
                },
                function(error) {
                  self.hideLoading()
                  self.showPopup(self.appSettings.config.FILE_NOT_FOUND, "");
                },
                function(progress) {
                  //  self.showLoading(spinOptions);
                })
          }
        }).error(function(error) {
          self.hideLoading();
          self.showPopup(self.appSettings.config.FILE_NOT_FOUND, "");
        }).finally(function() {
          self.hideLoading();
        });

      },

      displayNotePopup: function(scope, btn) {
        var self = this;
        if (typeof scope.actionNote === "undefined") {
          self.showPopup("Missing scope.actionNote def ", "");
        }
        var noteModal = $ionicPopup.show({
          template: '<div class="list pele-note-background pele_rtl">' +
            '<label class="item item-input"><textarea rows="8" ng-model="actionNote.text" type="text">{{actionNote.text}}</textarea></label>' +
            '</div>',
          title: '<strong class="float-right">הערות</strong>',
          subTitle: '',
          scope: scope,
          buttons: [{
              text: '<a class="pele-popup-positive-text-collot">המשך</a>',
              type: 'button-positive',
              onTap: function(e) {
                if (!scope.actionNote.text) {
                  e.preventDefault();
                  self.showPopup("יש להזין הערה", "");
                } else {
                  return scope.actionNote.text;
                }
              }
            },
            {
              text: 'ביטול',
              type: 'button-assertive',
              onTap: function(e) {
                return scope.actionNote.text;
              }
            },
          ]
        });
        noteModal.then(function(res) {
          scope.actionNote.text = res;
          if (typeof btn === "undefined")
            return true;

          if ((btn.note && res) || (!btn.note))
            scope.submitUpdateInfo(btn, res);
        });
      }
    };

  })
  .filter('peldate', function() {
    return function(dateString, opt1, opt2) {
      var date = moment(dateString, "YYYYMMDDHHmmss");
      return date.unix() * 1000;
    }
  }).filter('highlight', function($sce) {
    return function(text, phrase) {
      if (!text)
        return null;
      text = text.toString();
      if (phrase) text = text.replace(new RegExp('(' + phrase + ')', 'gi'), '<span class="highlighted">$1</span>');
      return $sce.trustAsHtml(text)
    }
  });
