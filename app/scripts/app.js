var myApp = angular.module('myApp', ['angular.filter', 'ngCookies', 'displayFilters', 'ui.bootstrap', 'toastr', 'ui-rangeSlider'])

myApp.controller('SliderCtrl', function ($scope, $modalInstance, item) {
  $scope.minAmount = 1;
  $scope.maxAmount = item.amount;
  $scope.selectedMax = $scope.maxAmount;

  $scope.ok = function () {
    $modalInstance.close($scope.selectedMax);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});

myApp.controller('ModalCtrl', function ($scope, bungie, $modalInstance, item, characters, activeChar, inventory, utils, loadInventory, $filter, $log, $q, toastr, $modal) {

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

  $scope.setFavorite = function () {
    $scope.clickedItem.favorite = !$scope.clickedItem.favorite;
    var favItem = {
      hash: $scope.clickedItem.hash,
      id: $scope.clickedItem.id
    };
    var favs = localStorage['favs'];
    if (favs == null)
      favs = [];

    if (!$scope.clickedItem.favorite) {
      for (var i = 0; i < favs.length; i++) {
        var f = favs[i];
        if (f.hash == favItem.hash && f.id == favItem.id) {
          favs.pop(f);
        }
      }
    }
    else {
      favs.push(favItem);
    }
  }

  // Moves an item to the vault
  $scope.moveToVault = function (item, amount) {

      var doMove = function (amt) {
        item.loading = true;
        if (item.equipped) {
          dequip(item, function () {
            item.equipped = false;

            bungie.transfer(item.owner, item.id, item.hash, amt, true, function (result, more) {
              if (more.ErrorStatus == "Success") {
                loadInventory(item.owner);
                loadInventory('vault');
                utils.success(more, 'Item successfully moved to vault.');
              } else {

                // Not necessarily vault is full. Need to investigate
                utils.error(more, "Vault is full. At least 1 free vault space is needed to transfer items between characters.");
              }

              $modalInstance.close(null);
            });

          });
          return;
        } else {
          bungie.transfer(item.owner, item.id, item.hash, amt, true, function (result, more) {
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

      if (item.amount > 1) {

        var modalInstance = $modal.open({
          templateUrl: 'slider.html',
          controller: 'SliderCtrl',
          backdrop: 'static',
          size: 'md',
          resolve: {
            item: function () {
              return item;
            }
          }
        });

        modalInstance.result.then(function (maxAmount) {
          doMove(maxAmount);
        }, function () {

        });

      } else {
        doMove(amount);
      }


    }
    // Equips an item.
  $scope.equip = function (item, char, amount) {
    item.loading = true;
    moveItem(item, char, amount, false);
  }

  $scope.store = function (item, char, amount) {
    item.loading = true;
    if (item.amount > 1) {

      var modalInstance = $modal.open({
        templateUrl: 'slider.html',
        controller: 'SliderCtrl',
        backdrop: 'static',
        size: 'md',
        resolve: {
          item: function () {
            return item;
          }
        }
      });

      modalInstance.result.then(function (maxAmount) {
        moveItem(item, char, maxAmount, true);
      }, function () {

      });
    } else {
      moveItem(item, char, amount, true);
    }

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
        item.loading = false;
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
            item.loading = false;
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
            item.loading = false;
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
                    item.loading = false;
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
              item.loading = false;
            }
          });

        } else {
          utils.error(more);
          item.loading = false;
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
  $scope.showCurrencies = true;

  $scope.toggleCurrencies = function () {
    $scope.showCurrencies = !$scope.showCurrencies;
  }

  $scope.currencies = [
    {
      name: "Strange Coins",
      hash: "1738186005",
      icon: "/common/destiny_content/icons/7cf72926fa2e5a118291fafbbe16b503.jpg",
      amount: 0
    },
    {
      name: "Motes of Light",
      hash: "937555249",
      icon: "/common/destiny_content/icons/2e026fc67d445e5b2630277aa794b4b1.jpg",
      amount: 0
    },
    {
      name: "Ascendant Shards",
      hash: "258181985",
      icon: "/common/destiny_content/icons/76ff3a1b1084b197784deec29eef45d1.jpg",
      amount: 0
    },
    {
      name: "Ascendant Energy",
      hash: "1893498008",
      icon: "/common/destiny_content/icons/f553cc54982b2fa666400d6880b72bfd.jpg",
      amount: 0
    },
    {
      name: "Radiant Shards",
      hash: "769865458",
      icon: "/common/destiny_content/icons/d656abfbeb17f82f85aa4c080d175b3d.jpg",
      amount: 0
    },
    {
      name: "Radiant Energy",
      hash: "616706469",
      icon: "/common/destiny_content/icons/eecdc248349253b60c76bd99136b6a65.jpg",
      amount: 0
    },
    {
      name: "Relic Iron",
      hash: "3242866270",
      icon: "/common/destiny_content/icons/af93e2c3bf2300707278140c901120aa.jpg",
      amount: 0
    },
    {
      name: "Spirit Bloom",
      hash: "2254123540",
      icon: "/common/destiny_content/icons/c189c4e4e41a6ffd998a532be7f724e1.jpg",
      amount: 0
    },
    {
      name: "Helium Filaments",
      hash: "1797491610",
      icon: "/common/destiny_content/icons/f5f546ab24a9a66ab80c9f3e692ad18e.jpg",
      amount: 0
    },
    {
      name: "Spinmetal",
      hash: "2882093969",
      icon: "/common/destiny_content/icons/c3a0d1d01636fd746542fdac60e1d2a4.jpg",
      amount: 0
    }
  ];

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

  $scope.favorites = [];

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

  function loadWeeklyHashes() {
    bungie.advisors(function (response) {
      var data = response.data;
      $scope.weeklyHashes.nightfall = data.nightfallActivityHash;
      $scope.weeklyHashes.heroic = data.heroicStrikeHashes;

      updateWeeklies();
    })
  }

  function totalCurrencies() {
    angular.forEach($scope.currencies, function (value, key) {
      value;
      var amount = 0;
      angular.forEach($scope.inventory, function (value2, key2) {
        if (value2.hash == value.hash) {
          amount += value2.amount;
        }
      });
      value.amount = amount;
    });

    //$scope.$apply();
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
        //$scope.$apply();
      });

      if (count != null && count == characterCount - 1) {
        loadWeeklyHashes();
        totalCurrencies();
      }


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