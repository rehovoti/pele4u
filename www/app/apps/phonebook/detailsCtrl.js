/**
 * Created by User on 25/08/2016.
 */
angular.module('pele', ['ngCordova'])
  //=================================================================
  //==                    PAGE_4
  //=================================================================
  .controller('phonebookDetailsCtrl', ['$scope', '$stateParams', '$ionicLoading', '$ionicModal', 'PelApi', '$ionicHistory', '$ionicPopup', '$cordovaSocialSharing', '$cordovaContacts',
    function($scope, $stateParams, $ionicLoading, $ionicModal, PelApi, $ionicHistory, $ionicPopup, $cordovaSocialSharing, $cordovaContacts) {

      //$scope.shareViaWhatsAppToReceiver = $cordovaSocialSharing.shareViaWhatsAppToReceiver;
      //$scope.shareViaEmail = $cordovaSocialSharing.shareViaEmail;
      //$scope.shareViaSMS = $cordovaSocialSharing.shareViaSMS;
      //$cordovaContacts.find().then(function(allContacts) {
      //    $scope.contacts = allContacts;
      //  }
      //  console.log($cordovaSocialSharing); $scope.shareViaEmail = function(email) {

      $cordovaSocialSharing.shareViaEmail(null, null, [email]);
    }

    $scope.shareViaSMS = function(mobilePhone) {

      $cordovaSocialSharing.shareViaSMS(null, mobilePhone);

    }

    $scope.shareViaWhatsAppToReceiver = function(mobilePhone) {
      $cordovaSocialSharing.shareViaWhatsAppToReceiver(mobilePhone)
      $cordovaSocialSharing.shareViaWhatsAppToReceiver(100)
    }

    $scope.shareViaWhatsApp = function() {
      alert('shareViaWhatsApp')
      $cordovaSocialSharing.shareViaWhatsApp()
    }

    $scope.empPic = function(base64String) {
      return "data:image/jpg;" + base64String;
    }

    $scope.managerInfo = {}

    $scope.getTreeData = function(person) {
      var tree = {};
      person.orgTree.forEach(function(c) {

        if (c.personId == person.directManagerNumber) {
          $scope.managerInfo = c;
          return false;
        }
        tree[c.directManagerNumber] = tree[c.directManagerNumber] || {};
        tree[c.directManagerNumber].members = tree[c.directManagerNumber].members || [];

        if (person.personId == c.directManagerNumber)
          tree[person.personId].members.push(c)
        else
          tree[c.personId] = c;
      })
      return tree;

    }


    $scope.getContact = function() {
      PelApi.getLocalJson("mocks/phonebook_details.json")
        .success((data, status, headers, config) => {
          console.log(JSON.stringify(data))
          $scope.contact = data;
          $scope.title = "פרטי עובד : " + data.lastName + " " + data.firstName;
          $scope.contact.tree = $scope.getTreeData(data);


        })
        .error((errorStr, httpStatus, headers, config) => {})
    }
    $scope.getContact();

  }]);
