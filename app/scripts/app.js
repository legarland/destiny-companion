angular.module('myApp', ['angular.filter', 'ngCookies', 'displayFilters'])
  .directive('localImage', ['$parse', 'utils', function ($parse, utils) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {

        var img = $(element[0]);
        chrome.storage.local.get(scope.item.icon, function (result) {
          if (result[scope.item.icon] !== undefined) {
            img.attr('src', 'data:image/png;base64,' + result[scope.item.icon])
          } else {
            img.on('load', function () {
              var base64Img = utils.getBase64Image(img[0]);
              var obj = {};
              obj[scope.item.icon] = base64Img;
              chrome.storage.local.set(obj);
            });
            img.attr('src', 'https://bungie.net' + scope.item.icon);
          }
        });
      }
    }
    }]).controller('MainController', function ($scope, bungie, utils, $filter, $timeout, $q) {

    //chrome.storage.local.clear();

    $scope.user = {};
    $scope.vault = 'loading';
    $scope.characters = [];
    $scope.inventory = [];
    $scope.utils = utils;
    $scope.selectedOwner = '';
    $scope.armorGrouping = ['Helmet', 'Gauntlets', 'Chest Armor', 'Leg Armor', 'Class Armor', 'Subclass'];
    $scope.weaponGrouping = ['Primary Weapons', 'Special Weapons', 'Heavy Weapons'];

    $scope.checkLocalStorage = function (key) {
      var def = $q.defer();
      chrome.storage.local.get(key, function (result) {
        if (result[key] !== undefined) {
          def.resolve(result[key]);
        } else {
          def.resolve('https://bungie.net' + key);
        }
      });

      def.promise.then(function (data) {
        return data;
      });
    }

    var advisors = [];
    var nightfallHash;

    // Used to handle the click event of the character card.
    $scope.selectOwner = function (id) {
      if ($scope.selectedOwner == id) {
        $scope.selectedOwner = '';
      } else {
        $scope.selectedOwner = id;
      }
    }

    function checkNightfallCompletion(characterId) {
      var char = findCharacterById(characterId);

      var nightfall = char.activities.activityAdvisors[nightfallHash].nightfall;
      var isComplete = nightfall.tiers[0].isCompleted;
      char.nightfall = isComplete;
      $scope.$apply();
    }

    // Load initial user
    bungie.user(function (u) {

      if (u.error) {

        // TODO: Tell User to login.

        return;
      }

      $scope.user = u;
      $scope.$apply();
      loadUser();
    });

    // Loads the user from bungie which then triggers the loading of inventory, vault, etc.
    function loadUser() {

      bungie.advisors(function (data) {
        advisors = data.data;
        nightfallHash = advisors.nightfallActivityHash
      });

      // Grab user info
      bungie.search(function (e) {
        if (e.error) {
          printError('Bungie.net user found, but was unable to find your linked ' + (bungie.active().type == 1 ? 'Xbox' : 'PSN') + ' account.');
          return;
        }

        // Load the vault
        bungie.vault(function (v) {
          if (v === undefined) {
            printError('Bungie.net user found, but was unable to find your linked ' + (bungie.active().type == 1 ? 'Xbox' : 'PSN') + ' account.');
            return;
          }

          $scope.inventory = [];
          utils.appendItems('vault', utils.flattenVault(v.data), $scope.inventory);

          var avatars = e.data.characters;

          for (var c = 0; c < avatars.length; c++) {
            var currentChar = avatars[c];
            var id2 = currentChar.characterBase.characterId;
            $scope.characters.push({
              id: id2,
              icon: currentChar.emblemPath,
              background: currentChar.backgroundPath,
              level: currentChar.characterLevel,
              class: utils.getClass(currentChar.characterBase.classType),
              percentToNextLevel: currentChar.percentToNextLevel
            });

            // Load Character Inventory

            loadInventory(id2);
            loadActivities(id2);
          }

        });

      });
    }

    function loadActivities(id) {
      bungie.characterAdvisors(id, function (data) {

        var char = findCharacterById(id);
        char.activities = data.data;
        checkNightfallCompletion(id);
      });
    }

    function loadInventory(c) {
      bungie.inventory(c, function (i) {
        utils.appendItems(c, utils.flattenInventory(i.data), $scope.inventory);
        $scope.tempinventory = $filter('itemDisplay')($scope.inventory);
        $scope.$apply();
      });
    }

    function findCharacterById(id) {
      for (var i = 0; i < $scope.characters.length; i++) {
        var char = $scope.characters[i];
        if (char.id == id) {
          return char;
        }
      }
      return undefined;
    }

    $scope.getMoteCount = function () {
      var arr = $filter('filter')($scope.inventory, {
        hash: 937555249
      });
      var count = 0;
      for (var x in arr) {
        var i = arr[x];
        count += i.amount;
      }

      return count;
    }

  });