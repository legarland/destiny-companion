angular.module('displayFilters', []).filter('itemDisplay', function () {
  return function (input, bucket) {
    var filtered = [];
    angular.forEach(input, function (item) {

            
      // Filter out items we dont want
      if (['Crucible Marks', 'Ghost', 'Emblems', 'Ships', 'Vehicle', 'Vanguard Marks', 'Shaders'].indexOf(item.bucket) == -1) {
        
        // Group Armor
        var armorIndex = ['Helmet', 'Gauntlets', 'Chest Armor', 'Leg Armor', 'Class Armor', 'Subclass'].indexOf(item.bucket);        
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
        var miscIndex = ['Materials', 'Consumables'].indexOf(item.bucket);
        if (miscIndex != -1) {
          item.order = miscIndex;
          item.displayBucket = "Misc"
        }
        
        if (bucket == undefined || item.displayBucket == bucket)
          filtered.push(item);
      }
    });
    return filtered;
  }
});