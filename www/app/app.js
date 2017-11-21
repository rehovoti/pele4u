// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('pele', ['ionic', 'ionic.native', 'ngStorage', 'tabSlideBox', 'pele.messages', 'pele.controllers', 'pele.factories', 'pele.config', 'pele.services'
    //-----------------------------------------//
    //--           MENU                      --//
    //-----------------------------------------//
    , 'pele.P1_appsListCtrl'
    //-----------------------------------------//
    //--       Authentication                --//
    //-----------------------------------------//
    , 'pele.authCtrl', 'pele.states', , 'fileLogger', 'oc.lazyLoad'
  ])

  .run(['$rootScope', '$ionicPlatform', '$state', '$ionicLoading', 'PelApi', 'appSettings',
    function($rootScope, $ionicPlatform, $state, $ionicLoading, PelApi, appSettings) {
      PelApi.init();

      $rootScope.$on('$stateChangeStart',
        function(event, toState, toParams, fromState, fromParams) {

          if (PelApi.global.get('debugFlag')) {
            PelApi.lagger.info("start StateChange ->  from :  " + fromState.name + " to: ", toState.name);
            PelApi.lagger.info(" new State params :  ", toParams);
          } else {
            PelApi.global.clear('lastStateChangeStart');
            PelApi.global.clear('lastStateChangeError');
            PelApi.global.clear('lastApiResponse');
            PelApi.global.clear('lastApiRequestConfig');
            PelApi.global.set('lastStateChangeStart', {
              toState: toState,
              toParams: toParams,
              fromState: fromState,
              fromParams: fromParams
            }, false)
          }
        });

      $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        if (PelApi.global.get('debugFlag')) {
          PelApi.lagger.error('State Resolve on ' + toState.name + ' -> Error: ', error);
        } else {
          PelApi.global.set('lastStateChangeError', {
            toState: toState,
            toParams: toParams,
            fromState: fromState,
            fromParams: fromParams
          }, false)
        }
      });


      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {});


      $ionicPlatform.ready(function() {
        //----------------------------------------
        //--    Get Version from config.xml
        //----------------------------------------
        if (window.cordova) {
          PelApi.cordovaInit();
          window.cordova.getAppVersion(function(version) {
            appSettings.config.APP_VERSION = version;
            PelApi.lagger.info("window.cordova.getAppVersion() : " + appSettings.config.APP_VERSION);
          });
        }


        if (window.cordova && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
          // org.apache.cordova.statusbar required
          StatusBar.styleDefault();
        }


        //----------------------------------
        //--    Go To Application List
        //----------------------------------
        $state.go("app.p1_appsLists");
      });
    }
  ])
  .config(function($stateProvider, $urlRouterProvider, appStates, $ionicConfigProvider) {
    $ionicConfigProvider.backButton.text('')
    $ionicConfigProvider.views.swipeBackEnabled(false);
    $ionicConfigProvider.navBar.alignTitle('center');

    $stateProvider
      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
      })
      //---------------------------------------------------------------------------//
      //--                           MENU                                        --//
      //---------------------------------------------------------------------------//
      .state('app.p1_appsLists', {
        url: '/p1_appsLists',
        views: {
          'menuContent': {
            templateUrl: 'templates/p1_appsLists.html',
            controller: 'P1_appsListCtrl'
          }
        }
      })


      //----------------------------------------------------------------------------//
      //--                         End docApprove
      //----------------------------------------------------------------------------//

      //---- home ----//
      .state('app.home', {
        url: '/home/:showLoading',
        views: {
          'menuContent': {
            templateUrl: 'templates/home.html',
            controller: 'homeCtrl'
          }
        }
      })
      //---------------------------------------------------------------------------//
      //--                        Authentication                                 --//
      //---------------------------------------------------------------------------//
      .state('app.login', {
        url: '/auth',
        views: {
          'menuContent': {
            templateUrl: 'templates/auth/login.html',
            controller: 'LoginCtrl'
          }
        }
      })
      .state('app.forgot-password', {
        url: '/auth',
        views: {
          'menuContent': {
            templateUrl: 'templates/auth/forgot-password.html',
            controller: 'ForgotPasswordCtrl'
          }
        }
      })
      //---------------------------------------------------------------------------//
      //--                         Settings                                      --//
      //---------------------------------------------------------------------------//
      .state('app.settings', {
        url: '/settings',
        views: {
          'menuContent': {
            templateUrl: 'templates/settings/settingsList.html',
            controller: 'SettingsListCtrl'
          }
        }
      })
      .state('app.settings.sendLog', {
        url: '/sendLog',
        views: {
          'menuContent': {
            templateUrl: 'templates/settings/sendLog.html',
            controller: 'SendLogCtrl'
          }
        }
      })
      .state('app.appProfile', {
        url: '/appProfile',
        views: {
          'menuContent': {
            templateUrl: 'templates/settings/appProfile.html',
            controller: 'AppProfileCtrl'
          }
        }
      })
      //------------------------------------------------------//
      //--            delete after test                     --//
      //------------------------------------------------------//
      .state('app.dir', {
        url: '/dir',
        views: {
          'menuContent': {
            templateUrl: 'templates/dir.html',
            controller: 'DirCtrl'
          }
        }
      })
      .state('app.file', {
        url: '/file',
        views: {
          'menuContent': {
            templateUrl: 'templates/file.html',
            controller: 'FileCtrl'
          }
        }
      })
      .state('app.error', {
        url: '/error',
        params: {
          error: {}
        },
        views: {
          'menuContent': {
            templateUrl: 'templates/error.html',
            controller: 'SettingsListCtrl'
          }
        }
      })


    appStates.forEach(function(state) {
      $stateProvider.state(state.state, {
        url: state.url,
        views: state.views,
        resolve: {
          deps: ['$ocLazyLoad', function($ocLazyLoad) {
            if (!state.src)
              return true;
            return $ocLazyLoad.load({
              name: state.state,
              files: state.src
            });
          }]
        }
      });
    })

    // if none of the above states are matched, use this as the fallback
    //$urlRouterProvider.deferIntercept();
    $urlRouterProvider.otherwise('/apps/home.html', {
      'showLoading': 'Y'
    });
  })
  .factory('httpRequestInterceptor', function($q, $injector, $rootScope) {
    var retries = 0,
      waitBetweenErrors = 0,
      maxRetries = 2;

    function onResponseError(httpConfig) {
      var $http = $injector.get('$http');
      return $http(httpConfig);
    }

    return {
      request: function(config) {
        config.requestTimestamp = new Date().getTime();
        config.headers = config.headers || {};
        if (config.url.match(/^http/)) {
          var PelApi = $injector.get('PelApi');
          if (PelApi.global.get('debugFlag')) {
            PelApi.lagger.info("---------------------------------------------")
            PelApi.lagger.info("-> " + config.method + " API request : " + config.url)
            PelApi.lagger.info("  headers : ", config.headers)
            PelApi.lagger.info("  data : ", config.data)
          } else {
            PelApi.global.set('lastApiRequestConfig', config, false)
          }

        }
        return config;
      },
      response: function(response) {
        response.config.responseTimestamp = new Date().getTime();
        if (response.config.url.match(/^http/)) {
          var PelApi = $injector.get('PelApi');
          PelApi.hideLoading();
          if (PelApi.global.get('debugFlag')) {
            PelApi.lagger.info("<-Response ( status:" + response.status + ") :", response.data)
          } else {
            PelApi.global.set('lastApiResponse', response, false)
          }
        }
        return response;
      },
      responseError: function(rejection) {
        // Retry
        var PelApi = $injector.get('PelApi');
        console.log("rejection:", rejection)
        rejection.config.responseTimestamp = new Date().getTime();
        if (retries < (rejection.config.retry || 0)) {
          PelApi.lagger.error("Reject & Retry . number :  " + retries, "on Config : ", rejection.config)
          retries++;
          return onResponseError(rejection.config);
        }
        retries = 0;
        return $q.reject(rejection);
      }
    };
  })
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('httpRequestInterceptor');
  })
