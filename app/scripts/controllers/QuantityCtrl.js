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