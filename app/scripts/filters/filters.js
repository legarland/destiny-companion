angular.module('displayFilters', []).filter('itemDisplay', function () {
  return function (input, bucket) {
    var filtered = [];
    angular.forEach(input, function (item) {


      // Filter out items we dont want
      if (['Crucible Marks', 'Ghost', 'Ships', 'Vehicle', 'Vanguard Marks'].indexOf(item.bucket) == -1) {

        // Group Armor
        var armorIndex = ['Helmet', 'Gauntlets', 'Chest Armor', 'Leg Armor', 'Class Armor', 'Subclass', 'Shaders', 'Emblems'].indexOf(item.bucket);
        if (armorIndex != -1) {
          item.order = armorIndex;
          item.displayBucket = "Armor";
        }

        // Group Weapons
        var weaponIndex = ['Primary Weapons', 'Special Weapons', 'Heavy Weapons'].indexOf(item.bucket);
        if (weaponIndex != -1) {
          item.order = weaponIndex;
          item.displayBucket = "Weapons"
        }

        // Group Misc
        var miscIndex = ['Materials', 'Consumables', 'Currency'].indexOf(item.bucket);
        if (miscIndex != -1) {
          item.order = miscIndex;
          item.displayBucket = "Misc"
        }

        var shouldAdd = true;
        for (var i = 0; i < filtered.length; i++) {
          var fItem = filtered[i];
          if (fItem.hash == item.hash && fItem.owner == item.owner && ['Weapons', 'Armor'].indexOf(item.displayBucket) == -1) {
            fItem.amount += item.amount;
            shouldAdd = false;
            break;
          }
        }

        if ((bucket == undefined || item.displayBucket == bucket) && shouldAdd)
          filtered.push(item);
      }
    });
    return filtered;
  }
}).filter('equipFilter', function () {
  return function (input, activeChar, item) {
    var filtered = [];

    angular.forEach(input, function (char) {

      // See if this item is equipped
      if (item.equipped) {

        // If it is equipped then only show chars that aren't weilding it.
        if (char.id != activeChar)
          filtered.push(char);
      } else {
        // Since it is not equipeed we can add all chars
        filtered.push(char);
      }
    });

    return filtered;
  }
}).filter('storeFilter', function () {
  return function (input, activeChar, item) {
    var filtered = [];

    angular.forEach(input, function (char) {

      // See if this item is equipped
      if (!item.equipped) {

        // If it is not equipped then only show chars that aren't weilding it.
        if (char.id != activeChar)
          filtered.push(char);
      } else {
        // Since it is not equipeed we can add all chars
        filtered.push(char);
      }
    });

    return filtered;
  }
}).filter('customFilter', function ($filter, utils) {
  return function (input, filters) {
    var out = [];

    if (utils.countFilters(filters) == 0)
      return input;

    angular.forEach(input, function (item) {
      
      // If there are any damageType filters
      if (filters.isArc || filters.isSolar || filters.isVoid) {
        if (filters.isArc && item.damageType == 2)
          out.push(item);
        if (filters.isVoid && item.damageType == 4)
          out.push(item);
        if (filters.isSolar && item.damageType == 3)
          out.push(item);
        return;
      }
      else {
        out.push(item);
      }
    });

    if (filters.searchText != '') {
      out = $filter('filter')(out, filters.searchText);
    }

    return out;
  }
});