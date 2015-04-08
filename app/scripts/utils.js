angular.module('myApp').service('utils', function ($filter, toastr) {

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
				type: itemDef.type,
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

	this.getBase64Image = function (img) {
		// Create an empty canvas element
		var canvas = document.createElement("canvas");
		var img2 = new Image();
		img2.src = img.src;
		canvas.width = img2.width;
		canvas.height = img2.height;

		// Copy the image contents to the canvas
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);

		// Get the data-URL formatted image
		// Firefox supports PNG and JPEG. You could check img.src to
		// guess the original format, but be aware the using "image/jpg"
		// will re-encode the image.
		var dataURL = canvas.toDataURL("image/png");

		return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
	}
	
	this.error = function(response, optionalMessage) {
		console.log(response);
    
    if (optionalMessage != null)
      toastr.error(optionalMessage);
    else
		  toastr.error(response.Message);
	}
	
	this.success = function(response, message) {
		console.log(response);
		toastr.success(message);
	}
	
  // Find a replacement item to equip.
	this.getReplacementItem = function (inventory, item) {
		
		var isExotic = (item.tier == "Exotic");
		
		var arr = [];
		if (isExotic)
			arr = $filter('filter')(inventory, { bucket: item.bucket,  owner: item.owner, tier: "Exotic", id:!item.id });
		
		// If the currently equipped itme isn't exotic, or we didn't find any other exotics
		if (!isExotic || arr.length == 0)
		{
			arr = $filter('filter')(inventory, { bucket: item.bucket, owner: item.owner, tier: '!Exotic', id: '!'+item.id });
		}
			
		
		// We didn't find anything suitable
		if (arr.length == 0) {
			return undefined;
		}
		// Return first available item.
		else {
			return arr[0];	
		}
	}
		

});