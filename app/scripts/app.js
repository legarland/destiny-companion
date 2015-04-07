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

  //getItem($scope.clickedItem);

  // Moves an item to the vault
  $scope.moveToVault = function (item, amount) {
      bungie.transfer(item.owner, item.id, item.hash, amount, true, function (result, more) {
        if (more.ErrorStatus == "Success")
        {
          loadInventory(item.owner);
          loadInventory('vault');
          util.success(more, 'Item successfully moved to vault.');
        }
        
        $modalInstance.close(null);
      });
    }
    // Equips an item.
  $scope.equip = function (item, char) {
    moveItem(item, char, false);
  }

  $scope.store = function (item, char) {
    moveItem(item, char, true);
  }

  // Stores an item.
  var dequip = function (item, char, callback) {

    // See if item is current equpped.
    if (item.equipped) {

      // Find a replacement item
      var replacementItem = utils.getReplacementItem(inventory, item);

      // Oops didn't find anything. Need to let user know.
      if (replacementItem === undefined) {
        // TODO: Let user know.	
        console.log("Didn't find anything to equip");
      } else {
        // Run the store command and then equip command.
        console.log("Equipping new item " + replacementItem.name);
        bungie.equip(item.owner, replacementItem.id, function (e, more) {
          console.log(more);
          if (more.ErrorCode == 1) {
            toastr.success('Item equipped/dequipped successfully.')
            item.equipped = false;
            callback();
          } else {
            utils.erorr(more);
          }
        });
      }
    }
  }

  var moveItem = function (item, char, isStore) {
    if (item.equipped) {
      dequip(item, char, function () {
        moveItem(item, char, isStore);
      });
      return;
    }


    if (item.owner == char.id && !isStore) {

      // Equip the item
      bungie.equip(char.id, item.id, function (e, more) {
        if (more.ErrorCode == 1) {
					toastr.success("Item successfully equipped");
          loadInventory(char.id);
        }
				else {
					utils.error(more);	
				}
      });
    }
    // All done, just reload
    else if (item.owner == char.id && isStore) {
      loadInventory(char.id);
    }
    // Need to move item to new character
    else if (item.owner != char.id && item.owner != 'vault') {

      // transfer to vault first.
      bungie.transfer(item.owner, item.id, item.hash, 1, true, function (e, more) {

        console.log(more);
        if (more.ErrorCode == 1) {
          //toastr.success('Success!', 'Item successfully transferred.')

          // Now movie item from vault to new char
          bungie.transfer('vault', item.id, item.hash, 1, true, function (e, more) {

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
      bungie.transfer(char.id, item.id, item.hash, 1, false, function (e, more) {
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

  // Arrays used for order/grouping 
  $scope.armorGrouping = ['Helmet', 'Gauntlets', 'Chest Armor', 'Leg Armor', 'Class Armor', 'Subclass'];
  $scope.weaponGrouping = ['Primary Weapons', 'Special Weapons', 'Heavy Weapons'];

  var advisors = [];
  var nightfallHash;

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

  function loadVault() {
    bungie.vault(function (v) {
      utils.appendItems('vault', utils.flattenVault(v.data), $scope.inventory);
    });
  }

  function loadInventory(c) {

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