/**
 * Created by User on 25/08/2016.
 */
angular.module('pele')
  //=================================================================
  //==                    PAGE_4
  //=================================================================
  .controller('leadCtrl', ['Contact', '$scope', '$stateParams', '$ionicLoading', '$ionicModal', 'PelApi', '$ionicHistory', '$ionicPopup', '$cordovaSocialSharing',
    function(Contact, $scope, $stateParams, $ionicLoading, $ionicModal, PelApi, $ionicHistory, $ionicPopup, $cordovaSocialSharing) {

      $scope.title = "לידים"
      $scope.handlers = [{
          id: "SHG",
          name: "שגרירים"
        },
        {
          id: "ISKI",
          name: "עיסקיים"
        },
        {
          id: "MANAGER",
          name: "מנהל ישיר"
        },
      ];

      $scope.getReport = function() {
        PelApi.showLoading();
        PelApi.http.get("http://private-29b7ea-leads16.apiary-mock.com/questions")
          .success(function(data, status, headers, config) {
            $scope.leads = data;
          })
          .error(function(errorStr, httpStatus, headers, config) {

          })
      }

      //  $scope.getReport();

    }
  ]);