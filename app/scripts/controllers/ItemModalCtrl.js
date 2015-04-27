myApp.controller('ModalCtrl', function ($scope, bungie, $modalInstance, item, characters, activeChar, inventory, utils, loadInventory, $filter, $log, $q, toastr, $modal) {

	$scope.clickedItem = item;
	$scope.characters = characters;
	$scope.activeChar = activeChar;
	$scope.inventory = inventory;
	$scope.fullItem = 'loading...';
	$scope.talentNodes = [];


	var getTalentNode = function (nodeHash, defs) {
		for (var i = 0; i < defs.length; i++) {
			var def = defs[i];
			if (def.nodeHash == nodeHash) {
				return def;
			}
		}
	}

	var getItem = function (item) {
		bungie.getItem(item.owner, item.id, function (result) {
			var nodes = result.data.talentNodes;
			var gridHash = result.data.item.talentGridHash
			var defs = result.definitions.talentGrids[gridHash].nodes;
			console.log(nodes);
			console.log(defs);

			angular.forEach(nodes, function (node) {
				var tNode = getTalentNode(node.nodeHash, defs);
				var step = tNode.steps[0];

				if (step.nodeStepName !== undefined) {
					$scope.talentNodes.push({
						nodeHash: node.nodeHash,
						name: step.nodeStepName,
						desc: step.nodeStepDescription,
						icon: step.icon,
						state: node.stateId,
						row: tNode.row,
						column: tNode.column,
						activated: node.isActivated,
						percent: node.progressPercent
					});
				}
			});

			console.log($scope.talentNodes);
		});
	}

	$scope.setFavorite = function () {
		$scope.clickedItem.favorite = !$scope.clickedItem.favorite;
		var favItem = {
			hash: $scope.clickedItem.hash,
			id: $scope.clickedItem.id
		};

		var favs = [];

		if (localStorage.favs != undefined)
			favs = JSON.parse(localStorage.favs);

		console.log(favs);

		if (!$scope.clickedItem.favorite) {
			for (var i = 0; i < favs.length; i++) {
				var f = favs[i];
				if (f.hash == favItem.hash && f.id == favItem.id) {
					favs.pop(f);
				}
			}
		} else {
			favs.push(favItem);
		}

		localStorage.favs = JSON.stringify(favs);
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
								utils.error(more, more.ErrorMessage);
								item.loading = false;
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
							utils.error(more, more.ErrorMessage);
							item.loading = false;
						}

						$modalInstance.close(null);
					});
				}
			}

			if (item.amount > 1) {

				var modalInstance = $modal.open({
					templateUrl: 'views/slider.html',
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
				templateUrl: 'views/slider.html',
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
		if (amount.length == 0)
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

			console.log('transferring from vault: ' + amount);

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

	getItem($scope.clickedItem);
});