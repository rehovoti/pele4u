/**
 * Created by User on 25/08/2016.
 */
angular.module('pele')
  //=================================================================
  //==                    PAGE_4
  //=================================================================
  .controller('phonebookDetailsCtrl', ['$scope', '$stateParams', '$ionicLoading', '$ionicModal', 'PelApi', '$ionicHistory', '$ionicPopup', '$cordovaSocialSharing',
    function($scope, $stateParams, $ionicLoading, $ionicModal, PelApi, $ionicHistory, $ionicPopup, $cordovaSocialSharing) {

      $scope.sendMail = function(contact) {
        $cordovaSocialSharing
          .shareViaEmail("pele4U message",
            null, contact.emailAddress, null, null, data)
          .then(function(result) {

          }, function(err) {

          });
      }

      $scope.empPic = function(base64String) {
        return "data:image/jpg;" + base64String;
      }

      $scope.getContact = function() {
        PelApi.getLocalJson("mocks/phonebook_details.json")
          .success((data, status, headers, config) => {
            console.log(JSON.stringify(data))
            $scope.contact = data;

            $scope.title = "פרטי עובד : " + data.lastName + " " + data.firstName;

          })
          .error((errorStr, httpStatus, headers, config) => {})
      }
      $scope.getContact();

    }
  ]);
