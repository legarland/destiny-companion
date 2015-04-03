myApp.directive('localImage', ['$parse', 'utils', function ($parse, utils) {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {

			var img = $(element[0]);
			chrome.storage.local.get(scope.item.icon, function (result) {
				if (result[scope.item.icon] !== undefined) {
					img.attr('src', 'data:image/png;base64,' + result[scope.item.icon])
				} else {
					img.on('load', function () {
						var base64Img = utils.getBase64Image(img[0]);
						var obj = {};
						obj[scope.item.icon] = base64Img;
						chrome.storage.local.set(obj);
					});
					img.attr('src', 'https://bungie.net' + scope.item.icon);
				}
			});
		}
	}
}]);