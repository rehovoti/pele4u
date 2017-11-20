angular.module('pele')
  //=================================================================
  //==                    PAGE_4
  //=================================================================
  .controller('externalCtrl', ['$scope', '$stateParams', '$ionicLoading', '$ionicModal', 'PelApi', '$ionicHistory', '$ionicPopup', '$fileLogger',
    function($scope, $stateParams, $ionicLoading, $ionicModal, PelApi, $ionicHistory, $ionicPopup, $fileLogger) {
      console.log($stateParams.url)
      PelApi.openExternal($stateParams.url)
    }
  ])
