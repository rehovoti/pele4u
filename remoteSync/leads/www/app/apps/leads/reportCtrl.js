/**
 * Created by User on 25/08/2016.
 */
angular.module('pele')
  .controller('phonebookListCtrl', function($scope, $stateParams, $ionicLoading, $state, PelApi, Contact, $ionicPopup, $ionicModal) {
    $scope.title = "אלפון"
    $scope.goHome = function() {
      PelApi.goHome();
    }
    $scope.page = 'form'
    $scope.setForm = function() {
      $scope.page = "form"
      $scope.searchResult = []
    }
    $scope.goBack = function() {
      $scope.modals.search.hide();
      $state.go("app.phonebook", {}, {
        reload: true
      })
    }

    $scope.modals = {
      operunits: {},
      search: {}
    }

    $ionicModal.fromTemplateUrl('operunits.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modals.operunits = modal;
    });

    $ionicModal.fromTemplateUrl('search.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modals.search = modal;
    });

    $scope.options = {
      loop: false,
      effect: 'fade',
      speed: 500,
      pagination: false,
      direction: 'vertical'
    }

    $scope.data = {}
    $scope.aaaa = "11111"
    $scope.displayElement = 'search';
    $scope.useful = [{
        displayName: "מוקד התפעול",
        phoneNumber: "050-707-8990"
      },
      {
        displayName: "חדר דואר",
        phoneNumber: "050-707-8863"
      },
      {
        displayName: "מרכזיה",
        phoneNumber: "050-707-8888"
      },
      {
        displayName: "לובי",
        phoneNumber: "050-707-8181"
      },
      {
        displayName: "מוקד ביטחון",
        phoneNumber: "050-707-8501"
      },
    ]

    $scope.sectors = [];
    $scope.getReport = function() {
      PelApi.getLocalJson("http://api.jsonbin.io/b/5a30d6fe26f8d31713912a73")
        .success(function(data, status, headers, config) {
          console.log(data)
          $scope.sectors = data;
        })
        .error(function(errorStr, httpStatus, headers, config) {

        })
    }

    $scope.getReport();

    $scope.search = function() {
      //  $scope.modals.search.show();
      $scope.title = "אלפון - תוצאות חיפוש"
      PelApi.getLocalJson("mocks/phonebook_list.json")
        .success(function(data, status, headers, config) {

          $scope.searchResult = data;
          $scope.page = 'result';
        })
        .error(function(errorStr, httpStatus, headers, config) {})
    }



    $scope.addContact = function(c) {
      Contact.save(c, PelApi.appSettings.config.contactIdPrefix).then(function(res) {
        swal({
          text: "! איש הקשר   עודכן במכשירך",
          icon: "success",
          button: "סגור!",
        });
      }).
      catch(function(err) {
        swal({
          text: "! התרחשה שגיאה" + JSON.stringify(err),
          icon: "error",
          timer: 2000
        });
      })
    }

    $scope.swalContact = function(c) {
      swal({
          text: "האם לשמור את איש הקשר במכשירכם ?",
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
        .then(function(value) {
          if (value === 'ok')
            $scope.addContact(c)
        });
    }



  });