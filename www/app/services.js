/**
 * Created by User on 27/01/2016.
 */
var app = angular.module('pele.services', []);
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
    this.clean = function(varname) {
      if ($localStorage[varname])
        delete $localStorage[varname];
    }

    this.set = function(varname, data, ttl) {
      // default ttl is one year
      if (typeof ttl === 'undefined')
        ttl = yearTtl;
      if (typeof $localStorage[varname] === 'undefined' || $localStorage[varname] === null || checkExpired($localStorage[varname])) {
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
  }]).service('SyncCodeService', ['$state', '$http', 'PelApi', 'StorageService', '$q', function($state, $http, PelApi, StorageService, $q) {
    var self = this;

    function CheckResource(url) {
      var http = new XMLHttpRequest();
      http.open('HEAD', url, false);
      http.send();
      return http.status != 404;
    }


    function setProgress(progress) {
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

    function resolvedStatesConfig(config, location) {
      var clonedConfig = _.clone(config);
      var resolvedStates = [];
      clonedConfig.states.forEach(function(s) {
        var tu = _.get(s, "templateUrl")
        if (tu) {
          if (!tu.match("^app/|^/app")) {
            var newlocation = location + "/" + tu;
            s.templateUrl = newlocation.replace(/\/+/g, "/");
          }
        }
        var viewsKey = _.keys(_.get(s, "views", {}));
        viewsKey.forEach(function(k, i) {
          var tu = _.get(s.views[k], "templateUrl")
          if (tu) {
            if (!tu.match("^app/|^/app")) {
              var newlocation = location + "/" + tu;
              s.views[k].templateUrl = newlocation.replace(/\/+/g, "/");
            }
          }
        })
        s.src.forEach(function(srcItem, index) {
          if (!srcItem.match("^app/|^/app")) {
            var newlocation = location + "/" + srcItem;
            s.src[index] = newlocation.replace(/\/+/g, "/");
          }
        })
        resolvedStates.push(s)
      })
      clonedConfig.states = resolvedStates;
      return clonedConfig;
    }

    function syncRemoteContect(config) {
      var deferred = $q.defer();

      if (!ionic.Platform.is('cordova')) {
        deferred.reject("עדכון קוד חם אפשרי רק במכשיר");
        return deferred.promise;
      }

      var sync = ContentSync.sync({
        src: config.src,
        id: config.appid,
        type: config.type
      });

      sync.on('progress', function(progress) {
        setProgress(progress);
      });
      sync.on('complete', function(data) {
        resolvedStatesConfig(config, data.localPath);
        deferred.resolve("עדכון אפליקציה הסתיים בהצלחה");
        //ContentSync.loadUrl("file://"+data.localPath + "/zipTest-master/www/index.html");
        //document.location = data.localPath + "/myapp/www/index.html";
      });
      sync.on('error', function(e) {
        deferred.reject("שגיאה בעדכון האפליקציה ");
      });
      return deferred.promise;
    }

    var showSyncState = function(str, icon, duration) {
      PelApi.hideLoading();
      var iconUrl = "./img/spinners/puff.svg"

      if (icon == "error")
        iconUrl = "./img/error.png";

      var duration = duration || 3000;
      var spinOptions = {
        delay: 0,
        duration: duration,
        template: '<div class="text-center"><p>' + str +
          ' </p><img ng-click="stopLoading()" class="spinner" src="' + iconUrl + '">' +
          '</div>',
      };
      PelApi.showLoading(spinOptions);
    }

    self.getRemoteApp = function(unfoundState, force) {
      var founds = unfoundState.to.match(/\w+$/);
      var appId = founds[0];
      var storageKey = appId + "_" + "remoteAppsConfig";
      if (force) {
        StorageService.clean(storageKey);
      }

      var stateOptions = unfoundState.options;
      stateOptions.reload = true;

      var remoteInfoUrl = "https://raw.githubusercontent.com/ghadad/pele4u/v117.9_remote_code/remoteSync/" + appId + "/config.json";

      var StorageAppConfig = _.get(StorageService.get(storageKey), "data");

      function registerStates(config) {
        var deferred = $q.defer();
        config.states.forEach(function(state) {
          var stateConfig;
          if (stateConfig = $state.get(state.state)) {

          } else {
            app.stateProvider.state(state.state, {
              url: state.url,
              views: state.views,
              resolve: {
                deps: ['$ocLazyLoad', '$q', function($ocLazyLoad, $q) {
                  if (!state.src)
                    return true;
                  return $q.all([$ocLazyLoad.load({
                    name: state.state,
                    files: state.src
                  })]).then(function(err) {}).catch(function(err) {
                    config.error = err;
                    deferred.reject(err)
                  });
                }]
              }
            });
          }
        });
        return deferred.promise;
      }



      if (StorageAppConfig) {
        if (!force) registerStates(StorageAppConfig).then(function(config) {

          StorageService.set(storageKey, config, 24 * 60 * 60);
        }).catch(function(err) {
          StorageService.clean(storageKey)
        });
        $state.go(unfoundState.to, unfoundState.toParams, stateOptions);
      } else {
        $http.get(remoteInfoUrl).success(function(data) {
          if (!force) registerStates(data).then(function(config) {
            StorageService.set(storageKey, config, 24 * 60 * 60);
          }).catch(function(err) {
            StorageService.clean(storageKey)
          });
          syncRemoteContect(data).then(function(res) {
            showSyncState(res)
            $state.go(unfoundState.to, unfoundState.toParams, stateOptions)
          }).catch(function(err) {
            StorageService.clean(storageKey)
            showSyncState(err, "error", 4000)
          })

        }).error(function(err) {
          showSyncState("נכשל לקבל מידע לגבי עדכון האפליקציה", "error", 4000)
        })
      }
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