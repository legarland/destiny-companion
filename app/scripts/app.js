angular.module('myApp', ['angular.filter']).controller('MainController', function ($scope, bungie, utils, $filter, $timeout) {

  $scope.user = {};
  $scope.vault = 'loading';
  $scope.characters = 'loading';
  $scope.inventory = [];
  var loader = { loaded: 0,	characters: 0 };

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
        loader.characters = avatars.length;

        for (var c = 0; c<avatars.length; c++) {
          // move.appendChild();
          //_storage[avatars[c].characterBase.characterId] = {
//            icon: avatars[c].emblemPath,
//            background: avatars[c].backgroundPath,
//            level: avatars[c].characterLevel,
//            class: utils.getClass(avatars[c].characterBase.classType)
//          }
          
          // Load Character Inventory
					var id2 = avatars[c].characterBase.characterId;
					loadInventory(id2);       
          
        }

      });

    });
  }
  
  function loadInventory(c) {
     bungie.inventory(c, function(i) {
      utils.appendItems(c, utils.flattenInventory(i.data), $scope.inventory);

      console.log('character: ' + c + ' - ' + i.data);

      $scope.$apply();
    });
  }

  $scope.getMoteCount = function() {
    var arr = $filter('filter')($scope.inventory, {hash: 937555249});
    var count = 0;
    for(var x in arr) {
      var i = arr[x];
      count += i.amount;
    }
    
    return count;
  }

});