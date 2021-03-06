angular.module('app')

.controller('feedsChartsCtrl', ['$scope', '$rootScope', '$filter', '$state', '$location', 'api', 'Assets', 'Charts', 'Translate', 'appcst',
  function($scope, $rootScope, $filter, $state, $location, api, Assets, Charts, Translate, appcst) {

    $scope.baseAsset = appcst.baseAsset;
    var unit = ($state.params.asset) ? $state.params.asset : 'USD';
    $scope.priceUnits = [{
      symbol: unit,
      name: unit,
      label: unit
    }];

    $location.search('asset=' + unit);

    $scope.priceUnit = $scope.priceUnits[0];
    $scope.currentUnit = $scope.priceUnit.name;

    $scope.$watch('currentUnit', function(newValue, oldValue) {
      if (newValue !== oldValue) {
        $scope.priceUnits.forEach(function(unit, i) {
          if (unit.name === newValue) {
            $scope.priceUnit = $scope.priceUnits[i];
            getFeedsData($scope.priceUnit.symbol);
            $location.search('asset=' + $scope.priceUnit.symbol);
          }
        });
      }
    });


    function reduceArray(array, x, y) {
      var returnArray = [];
      for (var i = 0; i < array.length; i++) {
        returnArray.push([array[i][x],
          array[i][y]
        ]);
      }
      return returnArray;
    }

    var rangeselector = {
      selected: 5,
      buttons: [{
        type: 'week',
        count: 1,
        text: '1w'
      }, {
        type: 'week',
        count: 2,
        text: '2w'
      }, {
        type: 'month',
        count: 1,
        text: '1m'
      }, {
        type: 'month',
        count: 3,
        text: '3m'
      }, {
        type: 'year',
        count: 1,
        text: '1y'
      }, {
        type: 'all',
        text: 'All'
      }]
    };

    var Size = {
      height: 300,
    };

    var yAxis = [{
      id: 'primary',
      labels: {
        align: 'left',
        format: '{value}' + ' USD/' + $scope.baseAsset,
      }
    }, { // Secondary yAxis
      opposite: false,
      labels: {
        format: '{value}' + '%',
      }
    }];

    var toolTip = {
      valueDecimals: 5,
      valueSuffix: ' USD/' + $scope.baseAsset
    };

    $scope.feedsChart = new Charts.chartConfig({
      useHighStocks: true,
      rangeSelector: rangeselector,
      series: [
        new Charts.serie({
          tooltip: toolTip,
        }),
        new Charts.serie({
          tooltip: toolTip,
        }),
        new Charts.serie({
          tooltip: {
            valueDecimals: 2,
            valueSuffix: '%'
          },
          yAxis: 1,
        })
      ],
      size: Size,
      yAxis: yAxis
    });

    function getFeedsData(asset) {
      api.getFeedCharts(asset).success(function(result) {
        var i;
        for (i = 0; i < result.assets.length; i++) {
          $scope.priceUnits[i] = {
            symbol: result.assets[i].symbol,
            name: result.assets[i].symbol,
            label: result.assets[i].symbol
          };
        }

        $scope.priceUnits.sort(function(a, b) {
          if (b.symbol > a.symbol) {
            return -1;
          } else if (b.symbol < a.symbol) {
            return 1;
          } else {
            return 0;
          }
        });

        var filterInt = Math.floor(result.stats.currentPrice.length / 400);

        result.stats.currentPrice = result.stats.currentPrice.filter(function(entry, index) {
          return (index % filterInt) === 0;
        });

        result.stats.vwap24hrs = result.stats.vwap24hrs.filter(function(entry, index) {
          return (index % filterInt) === 0;
        });

        result.stats.feed = result.stats.feed.filter(function(entry, index) {
          return (index % filterInt) === 0;
        });

        var deviation = [];
        for (i = 0; i < result.stats.feed.length; i++) {
          if (result.stats.currentPrice[i][1] && result.stats.feed[i][1]) {
            deviation.push([result.stats.feed[i][0], 100 * (result.stats.currentPrice[i][1] - result.stats.feed[i][1]) / (result.stats.feed[i][1])]);
          }
        }

        $scope.feedsChart.series[0].data = result.stats.feed;
        $scope.feedsChart.series[1].data = result.stats.currentPrice;
        $scope.feedsChart.series[2].data = deviation;

        var valueDecimals = (asset === 'BTC' || asset === 'SILVER') ? 6 : 4;

        for (i = 0; i < 3; i++) {
          $scope.feedsChart.series[i].tooltip = {
            valueDecimals: valueDecimals,
            valueSuffix: ' ' + asset + '/' + $scope.baseAsset
          };
        }

        $scope.feedsChart.yAxis[0] = {
          id: 'primary',
          labels: {
            align: 'left',
            format: '{value}' + ' ' + asset + '/' + $scope.baseAsset
          }
        };

        $scope.feedsChart.series[2].tooltip = {
          valueDecimals: 2,
          valueSuffix: '%'
        };
      });
    }
    getFeedsData($scope.priceUnit.symbol);

    function getTranslations() {
      Translate.feeds().then(function(result) {
        $scope.feedsChart.series[0].name = result.med;
        $scope.feedsChart.series[1].name = result.latest;
        $scope.feedsChart.series[2].name = result.deviation;
      });
    }

    getTranslations();

    $rootScope.$on('$translateLoadingSuccess', function() {
      getTranslations();
    });

    $rootScope.$on('languageChange', function() {
      getTranslations();
    });


  }
]);