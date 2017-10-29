/**
 * Created by User on 25/08/2016.
 */
angular.module('pele')
  .controller('phonebookListCtrl', function($scope, $stateParams, $ionicLoading, $state, PelApi, $cordovaContacts, $ionicPopup) {
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

    $scope.createContact = function(c) {
      if (window.plugins) {
        swal({
          text: "תכונה זאת נתמכת במכשיר בלבד!",
          icon: "success",
          button: "סגור!",
        });
        return false;
        $ionicPopup.alert({
          template: '<div class="text-center">' +
            'תכונה זאת נתמכת במכשיר בלבד' +
            '</div>'
        });
        return false;
      }
      swal({
          text: "האם לשמור את איש הקשר במכשירכם ?",
          buttons: ["סגור!", "ביטול"]
        })
        .then((value) => {
          swal(`The returned value is: ${value}`);
        });

      $cordovaContacts.save({
        "displayName": c.displayName,
        "phoneNumbers": c.phoneNumber
      }).then(function(result) {
        swal({
          text: "! איש הקשר   עודכן במכשירך",
          icon: "success",
          button: "סגור!",
        });
      }, function(error) {
        swal({
          text: "! התרחשה שגיאה",
          icon: "error",
          button: "סגור!",
        });
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

      console.log(data.slider)
    });

  });
