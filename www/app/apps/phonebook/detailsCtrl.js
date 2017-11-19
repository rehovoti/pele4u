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


      $scope.share = function(c) {
        window.plugins.socialsharing.shareViaEmail(
          null, // can contain HTML tags, but support on Android is rather limited:  http://stackoverflow.com/questions/15136480/how-to-send-html-content-with-image-through-android-default-email-client
          null, [c.emailAddress], // TO: must be null or an array
          null, // CC: must be null or an array
          null, // BCC: must be null or an array
          ['https://www.google.nl/images/srpr/logo4w.png', 'www/localimage.png'], // FILES: can be null, a string, or an array
          function() {}, // called when sharing worked, but also when the user cancelled sharing via email. On iOS, the callbacks' boolean result parameter is true when sharing worked, false if cancelled. On Android, this parameter is always true so it can't be used). See section "Notes about the successCallback" below.
          function() {} // called when sh*t hits the fan
        );


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

    }
  ]);
