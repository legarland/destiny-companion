myApp.controller('MainController', function ($scope, bungie, utils, $filter, $timeout, $modal) {

	//chrome.storage.local.clear();

	$scope.user = {};
	$scope.vault = 'loading';
	$scope.characters = [];
	$scope.inventory = [];
	$scope.utils = utils;
	$scope.selectedOwner = '';
	$scope.showCurrencies = true;
  $scope.filters = {
    searchText: '',
    isArc: false,
    isVoid: false,
    isSolar: false    
  }

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

	// Arrays used for order/grouping 
	$scope.armorGrouping = ['Helmet', 'Gauntlets', 'Chest Armor', 'Leg Armor', 'Class Armor', 'Subclass'];
	$scope.weaponGrouping = ['Primary Weapons', 'Special Weapons', 'Heavy Weapons'];

	var advisors = [];
	var nightfallHash;
	var characterCount = 0;

	$scope.favorites = [];

	$scope.openModal = function (item) {

		var modalInstance = $modal.open({
			templateUrl: 'views/itemModal.html',
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

		$scope.$apply();
	}

	// Checks whether or not the user has completed the nightfall
	function checkWeeklyCompletion(char) {
		var nightfall = char.activities.activityAdvisors[$scope.weeklyHashes.nightfall].nightfall;
		var heroicGroup = char.activities.activityAdvisors[$scope.weeklyHashes.heroic[0]];
		var crota = char.activities.activityAdvisors['1836893116'];
		var vault = char.activities.activityAdvisors['2659248071'];

		var heroic24 = heroicGroup.heroicStrike.tiers[2].isCompleted;
		var heroic28 = heroicGroup.heroicStrike.tiers[1].isCompleted;
		var heroic30 = heroicGroup.heroicStrike.tiers[0].isCompleted;

		var nightfall30 = nightfall.tiers[0].isCompleted;
		var crota30steps = crota.raidActivities.tiers[0].stepsComplete;
		var crota33steps = crota.raidActivities.tiers[1].stepsComplete;
		var vault26steps = vault.raidActivities.tiers[0].stepsComplete;
		var vault30steps = vault.raidActivities.tiers[1].stepsComplete;

		var weeklyStatusDef = {
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
		char.weeklyStatus = weeklyStatusDef;
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

		if (c == 'vault') {
			$scope.inventory = $filter('filter')($scope.inventory, {
				owner: '!' + c
			});
			loadVault();
			return;
		}

		bungie.inventory(c, function (i) {
			$scope.inventory = $filter('filter')($scope.inventory, {
				owner: '!' + c
			});
			utils.appendItems(c, utils.flattenInventory(i.data), $scope.inventory);
			$scope.inventory = $filter('itemDisplay')($scope.inventory);
			loadFavorites();

			bungie.completeCharacter(c, function (data) {
				var currencies = data.data.inventory.currencies;
				var user = findCharacterById(c);
				user.glimmer = currencies[0].value;
				user.vanguardMarks = currencies[2].value;
				user.crucibleMarks = currencies[1].value;
				//$scope.$apply();
			});

			if (count != null && count == characterCount - 1) {
				$timeout(function () {
					loadWeeklyHashes();
					totalCurrencies();
				}, 1000);
			}

		});
	}

	function loadFavorites() {
		var favs = localStorage.favs
		if (favs !== undefined) {
			favs = JSON.parse(favs);
			for (var i = 0; i < favs.length; i++) {
				var fav = favs[i];
				for (var x = 0; x < $scope.inventory.length; x++) {
					var item = $scope.inventory[x];
					if (fav.hash == item.hash && fav.id == item.id) {
						item.favorite = true;
						continue;
					}
				}
			}
		}

		//$scope.apply();
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

});