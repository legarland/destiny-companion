var myApp = angular.module('myApp', ['angular.filter', 'ngCookies', 'displayFilters'])
  
myApp.controller('MainController', function ($scope, bungie, utils, $filter, $timeout, $q) {

    //chrome.storage.local.clear();

    $scope.user = {};
    $scope.vault = 'loading';
    $scope.characters = [];
    $scope.inventory = [];
    $scope.utils = utils;
    $scope.selectedOwner = '';
	
		// Arrays used for order/grouping 
    $scope.armorGrouping = ['Helmet', 'Gauntlets', 'Chest Armor', 'Leg Armor', 'Class Armor', 'Subclass'];
    $scope.weaponGrouping = ['Primary Weapons', 'Special Weapons', 'Heavy Weapons'];

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

		$scope.moveToVault = function(item, owner) {
			bungie.transfer(owner, item.id, item.hash, 1, true, function (result, more) {
				if (more.ErrorStatus == "Success")
					loadInventory(owner);
			});
		}
		
		function reloadCharacter(owner) {
			
		}
		
		
		// Checks whether or not the user has completed the nightfall
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
						$scope.selectOwner($scope.characters[0].id);
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
			
			$scope.inventory = $filter('filter')($scope.inventory, {
				owner: '!'+c
			});
      bungie.inventory(c, function (i) {
        utils.appendItems(c, utils.flattenInventory(i.data), $scope.inventory);
        $scope.inventory = $filter('itemDisplay')($scope.inventory);
				
				bungie.completeCharacter(c, function (data) {
					console.log(data.data);
					var currencies = data.data.inventory.currencies;
					var user = findCharacterById(c);
					user.glimmer = currencies[0].value;
					user.vanguardMarks = currencies[2].value;
					user.crucibleMarks = currencies[1].value;
					$scope.$apply();
				});
				
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