angular.module('myApp').service('utils', function () {

  this.flattenVault = function (data) {
    var inv = [];
    var buckets = data.buckets;

    for (var b in buckets) {
      var items = buckets[b].items;
      for (var i in items) {
        inv.push(items[i]);
        // inv[items[i].itemInstanceId+items[i].itemHash] = items[i];
      }
    }

    return inv;
  }

  this.flattenInventory = function (data) {
    var inv = [];
    var buckets = data.buckets;

    for (var b in buckets) {
      // if(b === "Currency") continue;
      for (var s in buckets[b]) {
        var items = buckets[b][s].items;
        for (var i in items) {
          inv.push(items[i]);
          // inv[items[i].itemInstanceId+items[i].itemHash] = items[i];
        }
      }
    }

    return inv;
  }

  this.getClass = function (type) {
    switch (type) {
    case 0:
      return 'titan';
    case 1:
      return 'hunter';
    case 2:
      return 'warlock';
    }
    return 'unknown';
  }

  function getItemType(type, name) {
    if (type.indexOf("Engram") != -1 || name.indexOf("Marks") != -1) {
      return null;
    }
    if (["Pulse Rifle", "Scout Rifle", "Hand Cannon", "Auto Rifle"].indexOf(type) != -1)
      return 'Primary';
    if (["Sniper Rifle", "Shotgun", "Fusion Rifle"].indexOf(type) != -1) {
      // detect special case items that are actually primary weapons.
      if (["Vex Mythoclast", "Universal Remote", "No Land Beyond"].indexOf(name) != -1)
        return 'Primary';
      return 'Special';
    }
    if (["Rocket Launcher", "Machine Gun"].indexOf(type) != -1)
      return 'Heavy';
    if (["Gauntlets", "Helmet", "Chest Armor", "Leg Armor"].indexOf(type) != -1)
      return type.split(' ')[0];
    if (["Titan Subclass", "Hunter Subclass", "Warlock Subclass"].indexOf(type) != -1)
      return 'Class';
    if (["Restore Defaults"].indexOf(type) != -1)
      return 'Armor';
    if (["Titan Mark", "Hunter Cloak", "Warlock Bond", "Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle"].indexOf(type) != -1)
      return type.split(' ')[0];
    if (["Currency", "Helmet Engram", "Leg Armor Engram", "Body Armor Engram", "Gauntlet Engram", "Consumable", "Material", "Primary Weapon Engram"].indexOf(type) != -1)
      return 'Miscellaneous';
  }

  this.appendItems = function (owner, dataFrom, dataTo) {

    for (var o in dataFrom) {
      var item = dataFrom[o];
      var itemDef = _itemDefs[item.itemHash];

      if (itemDef === undefined) {
        continue;
      }

      dataTo.push({
        owner: owner,
        hash: item.itemHash,
        //type: itemType,
        //sort: itemSort,
        tier: itemDef.tier,
        name: itemDef.name,
        icon: itemDef.icon,
        notransfer: itemDef.notransfer,
        class: itemDef.class,
        bucket: itemDef.bucket,
        id: item.itemInstanceId,
        equipped: item.isEquipped,
        equipment: item.isEquipment,
        complete: item.isGridComplete,
        amount: item.stackSize,
        primStat: item.primaryStat,
        stats: item.stats,
        damageType: item.damageType
      });

    }
  }

  // Check if a stat of a certain type exists on this object.
  // [data] is expected to be the stats array of an inventory item.
  this.checkStatExists = function (data, _stat) {

    for (var i = 0; i < data.length; i++) {
      var stat = data[i];

      if (stat.statHash == _stat) {
        console.log(_stat);
        return true;
      }
    }
    return false;
  }

  // Get a specific stat value.
  // [data] is expected to be the stats array of an inventory item.
  this.getStatValue = function (data, _stat) {
    for (var i = 0; i < data.length; i++) {
      var stat = data[i];
      if (stat.statHash == _stat) {
        return stat.value;
      }
    }
    return '000';
  }

});