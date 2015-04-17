myApp.directive('localImage', ['$parse', 'utils', function ($parse, utils) {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {

      var img = $(element[0]);
      var it = localStorage.getItem(scope.item.icon);

      if (it) {
        img.attr('src', 'data:image/png;base64,' + it)
      } else {
        img.on('load', function () {
          var base64Img = utils.getBase64Image(img[0]);
          localStorage[scope.item.icon] = base64Img
        });
        img.attr('src', 'https://bungie.net' + scope.item.icon);
      }
    }
  }
}]).directive('loader', [function () {
  return {
    restrict: 'A',
    scope: {},
    link: function (scope, element, attr) {
      var loaderMarkup = $('<div class="spinner-bg"><div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div></div>');

      scope.$parent.$watch('item.loading', function () {
        if (scope.$parent.item.loading) {
          element.append(loaderMarkup);
        } else {
          element.find('.loader').remove();
        }
      });

    }
  }
}]).directive('tabPanel', [function () {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      $(element[0]).find('.tab-handle').each(function () {

        $(this).click(function () {

          var tab = $('#' + $(this).attr('tabname'));
          var isVisible = tab.is(":visible");
          $('.bottom-tab').hide();

          if (!isVisible)
            tab.show();
        });
      });
    }
  }
}]).directive('favorite', [function () {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      var cumulativeOffset = function (element) {
        var top = 0,
          left = 0;
        do {
          top += element.offsetTop || 0;
          left += element.offsetLeft || 0;
          element = element.offsetParent;
        } while (element);

        return {
          top: top,
          left: left
        };
      };

      $(element[0]).click(function () {
        var offset = cumulativeOffset(element[0]);
        var newStar = $(this).clone();
        newStar.css({
          position: 'absolute',
          top: offset.top,
          left: offset.left,
          zIndex: '9999999'
        });
        console.log(newStar);
        $('body').append(newStar);
        var el = $('#tab1Handle');
        var elOffset = cumulativeOffset(el[0]);
        newStar.animate({
          top: elOffset.top,
          left: elOffset.left + (el.width() / 2)
        }, {
          duration: 1000,
          specialEasing: {
            top: 'easeOutExpo',
            left: 'easeOutQuad'
          },
          complete: function () {
            newStar.remove();
          }
        });

      });
    }
  }
}]);