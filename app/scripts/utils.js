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
        stats: item.stats
      });
      
    }
    
    console.log(dataTo);
  }

});