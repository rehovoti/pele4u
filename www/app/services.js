/**
 * Created by User on 27/01/2016.
 */
var app = angular.module('pele.services', []);
app.service('SyncCodeService', ['$http', 'PelApi', '$localStorage', 'StorageService', function($http, PelApi, $localStorage, StorageService) {
  var self = this;
  self.getRemoteAppsConfig = function() {
    var cachedAppsConfig = StorageService.get("remoteAppsConfig")
    $http.get("https://raw.githubusercontent.com/ghadad/pele4u/v117.9_remote_code/remoteSync/config.json").success(function(data) {
      console.log(data);
      StorageService.set("remoteAppsConfig", data, 24 * 60 * 60);
    }).error(function(err) {
      console.log(err)
    })
  }
  var showSyncState = function(str, icon) {
    PelApi.hideLoading();
    var spinOptions = {
      delay: 0,
      template: '<div class="text-center">' + str +
        '<br \><img ng-click="stopLoading()" class="spinner" src="./img/spinners/puff.svg">' +
        '</div>',
    };
    PelApi.showLoading(spinOptions);
  }

  self.setProgress = function(progress) {
    if (progress.status) {
      switch (progress.status) {
        case 1:
          showSyncState("מוריד עדכון");
          break;
        case 2:
          showSyncState("פורס עדכון")
          break;
        case 3:
          showSyncState("סינכרון הושלם")
          break;
        default:
          //showSyncState("")
      }
    }
    if (progress.progress) {

    }
  }


  self.sync = function() {
    //var url = "http://localhost:8000/www.zip";
    var url = "https://github.com/ghadad/pele4u/archive/v117.8.zip";

    //var sync = ContentSync.sync({ src: url, id: 'myapp', type: 'merge', copyCordovaAssets: true, copyRootApp: false, headers: false, trustHost: true });
    //var sync = ContentSync.sync({ src: null, id: 'myapp', type: 'local', copyRootApp: true });
    var sync = ContentSync.sync({
      src: url,
      id: 'myapp',
      type: 'merge',
      copyCordovaAssets: true
    });

    var setProgress = self.setProgress;

    sync.on('progress', function(progress) {
      console.log("Progress event", progress);
      self.setProgress(progress);
    });
    sync.on('complete', function(data) {
      showSyncState("עדכון אפליקציה הסתיים בהצלחה")
      console.log("Complete", data);
      //ContentSync.loadUrl("file://"+data.localPath + "/zipTest-master/www/index.html");
      //document.location = data.localPath + "/myapp/www/index.html";
    });

    sync.on('error', function(e) {
      showSyncState("כישלון בעדכון אפליקציה")
    });
  }
  self.download = function() {
    document.getElementById("downloadExtractBtn").disabled = true;
    var url = "https://github.com/timkim/zipTest/archive/master.zip";
    var extract = self.extract;
    var setProgress = self.setProgress;
    var callback = function(response) {
      console.log(response);
      if (response.progress) {
        self.setProgress(response);
      }
      if (response.archiveURL) {
        var archiveURL = response.archiveURL;
        document.getElementById("downloadExtractBtn").disabled = false;
        document.getElementById("downloadExtractBtn").innerHTML = "Extract";
        document.getElementById("downloadExtractBtn").onclick = function() {
          self.extract(archiveURL);
        };
        document.getElementById("status").innerHTML = archiveURL;
      }
    };
    ContentSync.download(url, callback);
  }
  self.extract = function(archiveURL) {
    window.requestFileSystem(PERSISTENT, 1024 * 1024, function(fs) {
      fs.root.getDirectory('zipOutPut', {
        create: true
      }, function(fileEntry) {
        var dirUrl = fileEntry.toURL();
        var callback = function(response) {
          console.log(response);
          document.getElementById("downloadExtractBtn").style.display = "none";
          document.getElementById("status").innerHTML = "Extracted";
        }
        console.log(dirUrl, archiveURL);
        Zip.unzip(archiveURL, dirUrl, callback);
      });
    });
  }
}]);

app.service('StorageService', ['$http', 'PelApi', '$localStorage', function($http, PelApi, $localStorage) {
    // ttl - time ( seconds to live)

    var yearTtl = 60 * 60 * 24 * 365;

    function currentStamp() {
      return new Date().getTime();
    }

    function checkExpired(obj) {
      if (!obj) obj = {};
      if (!obj.ttl) obj.ttl = yearTtl;
      var current = new Date().getTime();
      if (currentStamp() - obj.timestamp > obj.ttl)
        return true;
      return false;
    }
    this.set = function(varname, data, ttl) {
      // default ttl is one year
      if (typeof ttl === 'undefined')
        ttl = yearTtl;
      if (typeof $localStorage[varname] === 'undefined' || $localStorage[varname] === null || isExpired($localStorage[varname])) {
        $localStorage[varname] = {};
        $localStorage[varname].data = data;
        $localStorage[varname].ttl = ttl;
        $localStorage[varname].timestamp = currentStamp();
      }
      return $localStorage[varname];
    }
    this.get = function(varname) {
      return $localStorage[varname];
    }
  }]).service('ApiService', ['$http', '$ionicHistory', 'PelApi', '$sessionStorage', function($http, $ionicHistory, PelApi, $sessionStorage) {
    var Errors = {
      2: {
        description: "token invalid",
        redirectToMenu: true
      },
      3: {
        description: "error in sso / pin code",
        redirectToMenu: true
      }
    }
    var env = PelApi.appSettings.env;
    var isValidJson = function(str) {
      try {
        JSON.stringify(str)
      } catch (err) {
        return false
      }
      return true
    }

    function buildServiceCaller(ServiceName, config) {
      var internal = {};
      var internalConfig = config;
      internal.timeout = internalConfig.timeout = internalConfig.timeout || PelApi.appSettings.api_timeout;
      internalConfig.params = internalConfig.params || {};



      var urlBase = PelApi.cordovaNetwork.getNetwork() === "wifi" ? PelApi.appSettings.apiConfig.wifi_uri : PelApi.appSettings.apiConfig.uri;
      var ServiceUrl = urlBase + '/' + PelApi.appSettings.SSOEnv[env] + '/CallMobileService';

      var authParams = $sessionStorage.ApiServiceAuthParams;
      authParams.APPID = internalConfig.AppId;
      var authParamsString = PelApi.toQueryString($sessionStorage.ApiServiceAuthParams)

      internal.url = ServiceUrl + '?' + authParamsString;
      var EnvCode = "MobileApp_" + PelApi.appSettings.EnvCodes[env];

      var request = {
        "Request": {
          "RequestHeader": {
            "ServiceName": ServiceName,
            "AppID": "MobileApp",
            "EnvCode": EnvCode,
            "Timeout": internalConfig.timeout
          },
          "InParams": {
            "PEL_PARAMETERS": {
              "LINE_NUMBER": "1",
              "P1": internalConfig.params.p1 || null,
              "P2": internalConfig.params.p2 || null,
              "P3": internalConfig.params.p3 || null,
              "P4": internalConfig.params.p4 || null,
              "P5": internalConfig.params.p5 || null,
              "P6": internalConfig.params.p6 || null,
              "P7": internalConfig.params.p7 || null,
              "P8": internalConfig.params.p8 || null,
              "P9": internalConfig.params.p9 || null,
              "P10": internalConfig.params.p10 || null,
              "P11": internalConfig.params.p11 || null,
              "P12": internalConfig.params.p12 || null,
              "P13": internalConfig.params.p13 || null,
              "P14": internalConfig.params.p14 || null,
              "P15": internalConfig.params.p15 || null
            }
          }

        }
      };

      internal.bodyRequest = request;
      return internal;
    }


    this.checkResponse = function(data, httpStatus) {
      var errorMsg = "InvalidJsonResponse";
      var sys = ""
      if (isValidJson(data) == false || !data) {
        errorMsg = "InvalidJsonResponse";
        if (typeof data === "string") {
          errorMsg = data;
        }
        return PelApi.throwError("api", "ApiService.checkResponse-InvalidJsonResponse", "(httpStatus : " + httpStatus + ") " + errorMsg)
      }
      if (data.Error && data.Error.errorCode) {
        errorMsg = "Application Error";
        sys = "api";
        var err = Errors[data.Error.errorCode] || {};
        if (err.redirectToMenu) {
          $ionicHistory.clearHistory();
          return PelApi.goHome();
        }
        return PelApi.throwError("api", "ApiService.checkResponse-" + errorMsg, "(httpStatus : " + httpStatus + ") " + JSON.stringify(data), false)
      }
      if (httpStatus != 200) {
        errorMsg = "http resource error";
        return PelApi.throwError("api", "ApiService.checkResponse-" + errorMsg, "(httpStatus : " + httpStatus + ")")
      }
      return data;
    }

    this.get = function() {
      return $http.get(urlBase);
    };

    this.post = function(ServiceName, AppId, requestParams) {

      var apiConfig = buildServiceCaller(ServiceName, {
        AppId: AppId,
        params: requestParams || {}
      })

      return $http.post(apiConfig.url, apiConfig.bodyRequest, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json ; charset=utf-8'
        }
      });

    };
  }])
  .service('srvShareData', function($window) {
    var KEY = 'App.SelectedValue';

    var addData = function(newObj) {
      var mydata = $window.sessionStorage.getItem(KEY);
      if (mydata) {
        mydata = JSON.parse(mydata);
      } else {
        mydata = [];
      }
      mydata.push(newObj);
      $window.sessionStorage.setItem(KEY, JSON.stringify(mydata));
    };

    var getData = function() {
      var mydata = $window.sessionStorage.getItem(KEY);
      if (mydata) {
        mydata = JSON.parse(mydata);
      }
      return mydata || [];
    };

    return {
      addData: addData,
      getData: getData
    };
  });