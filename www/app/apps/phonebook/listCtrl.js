/**
 * Created by User on 25/08/2016.
 */
angular.module('pele', [])
  .controller('phonebookListCtrl', function($scope, $stateParams, $ionicLoading, $state, PelApi, $cordovaContacts, $ionicPopup) {
    $scope.goHome = function() {
      PelApi.goHome();
    }

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
    console.log($cordovaContacts);


    $scope.saveInDevice = function(c) {
      var opts = { //search options
        filter: c.phoneNumber, // 'Bob'
        multiple: true, // Yes, return any contact that matches criteria
        fields: ["phoneNumbers", "displayName"], // These are the fields to search for 'bob'.
        desiredFields: ["phoneNumbers", "displayName"],
        hasPhoneNumber: true //return fields.
      };

      $cordovaContacts.find(opts).then(function(allContacts) {
        swal({
          text: "Search number :" + JSON.stringify(allContacts),
          icon: "success",
          button: "סגור!",
        });
      });

      if (!navigator.contacts) {
        swal({
          text: "תכונה זאת נתמכת במכשיר בלבד!",
          button: "סגור",
        });
        //  return false;
      }

      $cordovaContacts.save({
        phoneNumbers: [{
          "type": "Number",
          "value": c.phoneNumber,
          "pref": true
        }],
        "displayName": c.displayName,
        organizations: {
          name: "פלאפון"
        }
      }).then(function(result) {
          swal({
            text: "! איש הקשר   עודכן במכשירך",
            icon: "success",
            button: "סגור!",
          });

        },
        function(err) {
          swal({
            text: "! התרחשה שגיאה" + JSON.stringify(err),
            icon: "error",
            timer: 2000
          });

        });
    };

    $scope.createContact = function(c) {

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
            $scope.saveInDevice(c)
        });
    }

    $scope.slideNext = function() {
      $scope.slider.slideNext()
    }

    $scope.slidePrev = function() {
      $scope.slider.slidePrev()
    }
    $scope.slideTo = function(index) {
      $scope.slider.slideTo(index)
    }

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
      // data.slider is the instance of Swiper
      $scope.slider = data.slider;

    });

  });
