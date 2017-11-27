/**
 * Created by User on 25/08/2016.
 */
angular.module('pele')
  //=================================================================
  //==                    PAGE_4
  //=================================================================
  .controller('phonebookDetailsCtrl', ['Contact', '$scope', '$stateParams', '$ionicLoading', '$ionicModal', 'PelApi', '$ionicHistory', '$ionicPopup', '$cordovaSocialSharing', '$cordovaContacts',
    function(Contact, $scope, $stateParams, $ionicLoading, $ionicModal, PelApi, $ionicHistory, $ionicPopup, $cordovaSocialSharing, $cordovaContacts) {

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
        options.filter = PelApi.appSettings.config.contactIdPrefix;
        options.multiple = true;
        options.desiredFields = [$cordovaContacts.fieldType.id];
        options.hasPhoneNumber = true;
        var fields = [$cordovaContacts.fieldType.displayName, $cordovaContacts.fieldType.name, $cordovaContacts.fieldType.id];
        $cordovaContacts.find(fields, (res) => {
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
            var prms = $scope.addContact(c);
            console.log(prms)

          })
        }

        swal({
          title: "אנשי הקשר שבחרת נשמרו במכשירך",
          icon: "success",
        });
      }

      $scope.addContact = function(c) {
        Contact.save(c, PelApi.appSettings.config.contactIdPrefix).then((res) => {
          console.log("Saved :", res)
        }).
        catch((err) => {
          console.log("contact err:", err)
        })
      }

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
