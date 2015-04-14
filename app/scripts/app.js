var myApp = angular.module('myApp', ['angular.filter', 'ngCookies', 'displayFilters', 'ui.bootstrap', 'toastr'])

myApp.controller('ModalCtrl', function ($scope, bungie, $modalInstance, item, characters, activeChar, inventory, utils, loadInventory, $filter, $log, $q, toastr) {

  $log.info(item);
  $scope.clickedItem = item;
  $scope.characters = characters;
  $scope.activeChar = activeChar;
  $scope.inventory = inventory;
  $scope.fullItem = 'loading...';

  var getItem = function (item) {
    bungie.getItem(item.owner, item.id, function (result) {
      $scope.fullItem = result.data;
    });
  }

  // Moves an item to the vault
  $scope.moveToVault = function (item, amount) {
      item.loading = true;
      if (item.equipped) {
        dequip(item, function () {
          item.equipped = false;

          bungie.transfer(item.owner, item.id, item.hash, amount, true, function (result, more) {
            if (more.ErrorStatus == "Success") {
              loadInventory(item.owner);
              loadInventory('vault');
              utils.success(more, 'Item successfully moved to vault.');
            } else {
              utils.error(more, "Vault is full. At least 1 free vault space is needed to transfer items between characters.");
            }

            $modalInstance.close(null);
          });

        });
        return;
      } else {
        bungie.transfer(item.owner, item.id, item.hash, amount, true, function (result, more) {
          if (more.ErrorStatus == "Success") {
            loadInventory(item.owner);
            loadInventory('vault');
            utils.success(more, 'Item successfully moved to vault.');
          } else {
            utils.error(more, "Vault is full. At least 1 free vault space is needed to transfer items between characters.");
          }

          $modalInstance.close(null);
        });
      }
    }
    // Equips an item.
  $scope.equip = function (item, char, amount) {
    item.loading = true;
    moveItem(item, char, amount, false);
  }

  $scope.store = function (item, char, amount) {
    item.loading = true;
    moveItem(item, char, amount, true);
  }

  // Stores an item.
  var dequip = function (item, callback) {

    // See if item is current equpped.
    if (item.equipped) {

      // Find a replacement item
      var replacementItem = utils.getReplacementItem(inventory, item);

      // Oops didn't find anything. Need to let user know.
      if (replacementItem === undefined) {
        // TODO: Let user know.	
        toastr.error(null, "Couldn't find another item to equip.");
      } else {

        // Run the store command and then equip command.
        bungie.equip(item.owner, replacementItem.id, function (e, more) {
          if (more.ErrorCode == 1) {
            toastr.success('Item equipped/dequipped successfully.')
            item.equipped = false;
            loadInventory(item.owner);
            callback();
          } else {
            utils.erorr(more);
          }
        });
      }
    }
  }

  var moveItem = function (item, char, amount, isStore) {

    // If we didn't pass an amount then just use 1
    if (!amount.length)
      amount = 1;

    // If the item is equipped then we need to dequip it before doing anything.
    if (item.equipped) {
      dequip(item, function () {
        item.equipped = false;
        moveItem(item, char, amount, isStore);
      });
      return;
    }
    // If the item as reached its destination.
    if (item.owner == char.id) {

      // If we still need to equip this item then equip it.
      if (!isStore) {
        // Equip the item
        bungie.equip(char.id, item.id, function (e, more) {
          if (more.ErrorCode == 1) {
            toastr.success("Item successfully equipped");
          } else {
            utils.error(more);
          }

          loadInventory(char.id);
        });
      }
      // Item has reached its destination. Go ahead and reload inventory.
      else {
        loadInventory(char.id);
      }
    }
    // Need to move item to new character
    else if (item.owner != char.id && item.owner != 'vault') {

      // transfer to vault first.
      bungie.transfer(item.owner, item.id, item.hash, amount, true, function (e, more) {

        console.log(more);
        if (more.ErrorCode == 1) {

          // Now movie item from vault to new char
          bungie.transfer(char.id, item.id, item.hash, amount, false, function (e, more) {

            if (more.ErrorCode == 1) {

              // Equip on new character (if needed)
              if (!isStore) {
                bungie.equip(char.id, item.id, function (e, more) {
                  if (more.ErrorCode == 1) {
                    toastr.success('Item successfully equipped');
                  } else {
                    utils.error(more);
                  }
                  loadInventory(item.owner);
                  loadInventory(char.id);
                });
              } else {
                toastr.success('Item successfully transferred.');
                loadInventory(item.owner);
                loadInventory(char.id);
              }
            } else {
              utils.error(more);
            }
          });

        } else {
          utils.error(more);
        }

      });

    } else if (item.owner == 'vault') {
      bungie.transfer(char.id, item.id, item.hash, amount, false, function (e, more) {
        if (more.ErrorCode == 1) {
          toastr.success('Item successfully transferred.');
          loadInventory(item.owner);
          loadInventory(char.id);
        } else {
          utils.error(more)
        }
      });
    } else {
      loadInventory(item.owner);
      loadInventory(char.id);
    }

    $modalInstance.close(null);
  }

  $scope.ok = function () {
    $modalInstance.close(null);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});

myApp.controller('MainController', function ($scope, bungie, utils, $filter, $timeout, $modal) {

  //chrome.storage.local.clear();

  $scope.user = {};
  $scope.vault = 'loading';
  $scope.characters = [];
  $scope.inventory = [];
  $scope.utils = utils;
  $scope.selectedOwner = '';
  $scope.weeklyHashes = {
    nightfall: '',
    heroic: [],
    crota: [],
    vault: []
  };
  $scope.weeklyStatus = {
    nightfall: false,
    heroic: {
      level24: false,
      level28: false,
      level30: false
    },
    crota: {
      level30: {
        steps: 0
      },
      level33: {
        steps: 0
      }
    },
    vault: {
      level26: {
        steps: 0
      },
      level30: {
        steps: 0
      }
    }
  };

  // Arrays used for order/grouping 
  $scope.armorGrouping = ['Helmet', 'Gauntlets', 'Chest Armor', 'Leg Armor', 'Class Armor', 'Subclass'];
  $scope.weaponGrouping = ['Primary Weapons', 'Special Weapons', 'Heavy Weapons'];

  var advisors = [];
  var nightfallHash;
  var characterCount = 0;

  $scope.openModal = function (item) {
    var modalInstance = $modal.open({
      templateUrl: 'itemModal.html',
      controller: 'ModalCtrl',
      size: 'lg',
      resolve: {
        item: function () {
          return item;
        },
        characters: function () {
          return $scope.characters;
        },
        activeChar: function () {
          return $scope.selectedOwner;
        },
        inventory: function () {
          return $scope.inventory;
        },
        loadInventory: function () {
          return loadInventory;
        }
      }
    });
  }

  // Used to handle the click event of the character card.
  $scope.selectOwner = function (id) {
    if ($scope.selectedOwner == id) {
      $scope.selectedOwner = '';
    } else {
      $scope.selectedOwner = id;
    }
  }

  // Moves an item to the vault
  $scope.moveToVault = function (item, owner, amount) {
    bungie.transfer(owner, item.id, item.hash, amount, true, function (result, more) {
      if (more.ErrorStatus == "Success")
        loadInventory(owner);
    });
  }

  // Transfers and item from one character/vault to another
  $scope.transfer = function (from, to, item, amount) {
    bungie.transfer(owner, item.id, item.hash, amount, true, function (result, more) {
      if (more.ErrorStatus == "Success")
        loadInventory(owner);
    });
  }

  function reloadCharacter(owner) {

  }

  function loadWeeklyHashes() {
    bungie.advisors(function (response) {
      var data = response.data;
      $scope.weeklyHashes.nightfall = data.nightfallActivityHash;
      $scope.weeklyHashes.heroic = data.heroicStrikeHashes;

      updateWeeklies();
    })
  }

  function updateWeeklies() {
    for (var i in $scope.characters) {
      var char = $scope.characters[i];
      checkWeeklyCompletion(char);
    }
  }

  // Checks whether or not the user has completed the nightfall
  function checkWeeklyCompletion(char) {
    var nightfall = char.activities.activityAdvisors[$scope.weeklyHashes.nightfall].nightfall;
    var heroicGroup = char.activities.activityAdvisors[$scope.weeklyHashes.heroic[0]];
    var crota = char.activities.activityAdvisors['1836893116'];
    var vault = char.activities.activityAdvisors['2659248071'];

    var heroic24 = heroicGroup.heroicStrike.tiers[2].isComplete;
    var heroic28 = heroicGroup.heroicStrike.tiers[1].isComplete;
    var heroic30 = heroicGroup.heroicStrike.tiers[0].isComplete;
    var nightfall30 = nightfall.tiers[0].isCompleted;
    var crota30steps = crota.raidActivities.tiers[0].stepsComplete;
    var crota33steps = crota.raidActivities.tiers[1].stepsComplete;
    var vault26steps = vault.raidActivities.tiers[0].stepsComplete;
    var vault30steps = vault.raidActivities.tiers[1].stepsComplete;

		char.weeklyStatus = $scope.weeklyStatus;
    char.weeklyStatus.nightfall = nightfall30;
    char.weeklyStatus.heroic = {
      level24: heroic24,
      level28: heroic28,
      level30: heroic30
    }
    char.weeklyStatus.crota.level30.steps = crota30steps;
    char.weeklyStatus.crota.level33.steps = crota33steps;
    char.weeklyStatus.vault.level26.steps = vault26steps;
    char.weeklyStatus.vault.level30.steps = vault30steps;

    $scope.$apply();
  }

  // Load initial user
  bungie.user(function (u) {

    if (u.error) {

      // TODO: Tell User to login.

      return;
    }

    $scope.user = u;
    //$scope.$apply();
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
        characterCount = avatars.length;

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

          loadInventory(id2, c);
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
    });
  }

  function loadVault() {
    bungie.vault(function (v) {
      utils.appendItems('vault', utils.flattenVault(v.data), $scope.inventory);
    });
  }

  function loadInventory(c, count) {



    $scope.inventory = $filter('filter')($scope.inventory, {
      owner: '!' + c
    });

    if (c == 'vault') {
      loadVault();
      return;
    }


    bungie.inventory(c, function (i) {
      utils.appendItems(c, utils.flattenInventory(i.data), $scope.inventory);
      $scope.inventory = $filter('itemDisplay')($scope.inventory);

      bungie.completeCharacter(c, function (data) {
        var currencies = data.data.inventory.currencies;
        var user = findCharacterById(c);
        user.glimmer = currencies[0].value;
        user.vanguardMarks = currencies[2].value;
        user.crucibleMarks = currencies[1].value;
        $scope.$apply();
      });

      if (count != null && count == characterCount - 1) {
        loadWeeklyHashes();
      }

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