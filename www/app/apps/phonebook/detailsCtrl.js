/**
 * Created by User on 25/08/2016.
 */
angular.module('pele', ['ionic.native'])
  //=================================================================
  //==                    PAGE_4
  //=================================================================
  .controller('phonebookDetailsCtrl', ['$scope', '$stateParams', '$ionicLoading', '$ionicModal', 'PelApi', '$ionicHistory', '$ionicPopup', '$cordovaSocialSharing', '$cordovaContacts',
    function($scope, $stateParams, $ionicLoading, $ionicModal, PelApi, $ionicHistory, $ionicPopup, $cordovaSocialSharing, $cordovaContacts) {


      $scope.actions = function(group, contact, orgTree) {
        console.log(contact)
        var swal_str = ""
        if (group === "members_tree") {
          swal_str = "הוסף רשימת " + contact.orgName
        }
        if (group === "manager_tree") {
          swal_str = "הוסף רשימת " + contact.orgName
        }
        swal({
            text: swal_str,
            buttons: {
              "cancel": {
                text: "ביטול",
                value: "cancel",
                visible: true
              },
              approve: {
                text: "אישור",
                value: "ok",
              }
            }
          })
          .then((value) => {
            if (value === 'ok')
              $scope.addGroup(group, contact, orgTree)
          });
      }

      $scope.addGroup = function(group, contact, orgTree) {
        var options = new ContactFindOptions();
        options.filter = null;
        options.multiple = true;
        options.desiredFields = [navigator.contacts.fieldType.id];
        options.hasPhoneNumber = true;
        var fields = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
        navigator.contacts.find(fields, (res) => {
          res.forEach((con) => {
            con.remove(() => {}, () => {});
          })
          console.table(res)
        }, () => {}, options);

        var relation = ""
        if (group === "members_tree") {
          relation = "managed";
          orgTree.forEach((c) => {
            if (c.relation === relation || c.personId == contact.personId)
              $scope.addContact(c);
          })
        }
        if (group === "manager_tree") {
          orgTree.forEach((c) => {
            $scope.addContact(c);
          })
        }

        swal({
          title: "אנשי הקשר שבחרת נשמרו במכשירך",
          icon: "success",
        });
      }

      $scope.addContact = function(c) {

        var contact = navigator.contacts.create({
          "displayName": c.fullName
        });
        var phoneNumbers = [];
        phoneNumbers.push(new ContactField('work', c.workPhone, false))
        phoneNumbers.push(new ContactField('mobile', c.mobilePhone, true))
        contact.phoneNumbers = phoneNumbers;
        contact.save(() => {}, () => {});
      };

      $scope.shareViaEmail = function(email) {
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

    }
  ]);
