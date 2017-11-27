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

    $scope.search = function() {
      //  $scope.modals.search.show();
      $scope.title = "אלפון - תוצאות חיפוש"
      PelApi.getLocalJson("mocks/phonebook_list.json")
        .success((data, status, headers, config) => {
          console.log(JSON.stringify(data))
          $scope.searchResult = data;
          $scope.page = 'result';
        })
        .error((errorStr, httpStatus, headers, config) => {})
    }



    $scope.addContact = function(c) {
      Contact.save(c, PelApi.appSettings.config.contactIdPrefix).then((res) => {
        swal({
          text: "! איש הקשר   עודכן במכשירך",
          icon: "success",
          button: "סגור!",
        });
      }).
      catch((err) => {
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
        .then((value) => {
          if (value === 'ok')
            $scope.addContact(c)
        });
    }



  });
