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

          $(this).addClass('tab-selected');
          $(this).siblings().removeClass('tab-selected');
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
        var el = $('#tab1Handle');
        var elOffset = cumulativeOffset(el[0]);

        var newTop, newLeft;

        if (!scope.clickedItem.favorite) {
          newTop = elOffset.top;
          newLeft = elOffset.left;
          animTop = offset.top;
          animLeft = offset.left;
        } else {
          newTop = offset.top;
          newLeft = offset.left;
          animTop = elOffset.top;
          animLeft = elOffset.left + (el.width() / 2);
        }

        newStar.css({
          position: 'absolute',
          top: newTop,
          left: newLeft,
          zIndex: '9999999'
        });

        $('body').append(newStar);

        newStar.animate({
          top: animTop,
          left: animLeft,
          opacity: 0
        }, {
          duration: 1500,
          specialEasing: {
            top: 'easeOutExpo',
            left: 'easeOutExpo'
          },
          complete: function () {
            newStar.remove();
          }
        });

      });
    }
  }
}]).directive('talentNodes', ['$filter', function ($filter) {
  return {
    restrict: 'AE',
    link: function (scope, element, attr) {

      var isSublcass = scope.clickedItem.bucket == 'Subclass';

      scope.$watch('talentNodes', function (newVal, oldVal) {

        if (newVal) {

          // clear nodes
          $(element[0]).empty();

          // order by column then row
          var nodes = $filter('orderBy')(scope.talentNodes, ['column', 'row']);

          // Loop through and find highest num of rows and columns
          var curCol = 0;
          var colContainerDef = $('<div class="node-column"></div>');
          if (isSublcass)
            colContainerDef.addClass('subclass');
          
          var cWidthHeight = 80;
          var rad = 37.5;
          
          if (isSublcass) {
            cWidthHeight = 65;
            rad = 30;
          }
          
          var curColContainer = colContainerDef.clone();
          for (var i = 0; i < nodes.length; i++) {
            var tNode = nodes[i];

            
            if (tNode.column != curCol) {
              $(element[0]).append(curColContainer);
              curColContainer = colContainerDef.clone();
              curCol = tNode.column;
            }

            var node = $('<div class="node"></div>');
            node.attr('data-nodeHash', tNode.nodeHash);
            

            var icon = $('<div class="icon" style="background-image: url(https://bungie.net' + tNode.icon + ');"></div>');

            if (tNode.activated)
              node.addClass('complete');

            node.popover({
              content: tNode.desc,
              trigger: 'hover',
              title: tNode.name,
              placement: 'top'
            });
            node.append(icon);
            var canvas = document.createElement('canvas');
            canvas.width = cWidthHeight;
            canvas.height = cWidthHeight;
            
            var per = (tNode.percent == 0) ? 0 : tNode.percent/100;
            
            // check for first sight node. If it has 'MustSwap' then it should actually be 100 percent
            if (tNode.state == 'MustSwap') {
              per = 1;
            }
            
            var context = canvas.getContext('2d');
            context.translate(cWidthHeight, cWidthHeight);
            context.scale(-1, -1);
            context.translate(cWidthHeight/2, cWidthHeight/2);
            context.rotate(90*Math.PI/180);
            context.translate(-cWidthHeight, -cWidthHeight);
            var x = canvas.width / 2;
            var y = canvas.height / 2;
            var radius = rad;
            var startAngle = 0;
            var endAngle = (Math.PI * 2 * per);
            //var endAngle = ((1-tNode.percent) * 360.0) * (Math.PI/180);
            var counterClockwise = false;
            context.beginPath();
            context.arc(x, y, radius, startAngle, endAngle, counterClockwise);
            context.lineWidth = 3;
            context.lineCap = "butt";
            

            // line color
            context.strokeStyle = '#47FC0C';
            context.stroke();
            
            
            
            var canvasBG = document.createElement('canvas');
            canvasBG.style.zIndex = 1;
            canvasBG.width = cWidthHeight;
            canvasBG.height = cWidthHeight;
            var per2 = -(100 == 0) ? 0 : 100/100; //Math.min(Math.max(0, tNode.percent || 1), 1);
            var context2 = canvasBG.getContext('2d');
            var x2 = canvasBG.width / 2;
            var y2 = canvasBG.height / 2;
            var radius2 = rad;
            var startAngle2 = 0;
            var endAngle2 = (-Math.PI * 2 * per2);
            //var endAngle = ((1-tNode.percent) * 360.0) * (Math.PI/180);
            var counterClockwise2 = true;
            context2.beginPath();
            context2.arc(x2, y2, radius2, startAngle2, endAngle2, counterClockwise2);
            context2.lineWidth = 3;
            context2.lineCap = "butt";

            // line color
            context2.strokeStyle = 'gray';
            context2.stroke();
            
            node.append(canvas);
            node.append(canvasBG);
            curColContainer.append(node);            

          };
          $(element[0]).append(curColContainer);

        }

      }, true);
    }
  }
}]);