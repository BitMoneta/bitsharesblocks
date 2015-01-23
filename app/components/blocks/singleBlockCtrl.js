angular.module('app')

.controller('blockCtrl', ['$scope', '$rootScope', '$location', '$state', 'Assets', 'Accounts', 'Block', 'Translate',
  function($scope, $rootScope, $location, $state, Assets, Accounts, Block, Translate) {

    $scope.blockNumber = $state.params.id;
    $scope.votes = [];
    $scope.issuerName = {};
    $scope.types = {};
    $scope.orderByField = 'delegate';
    $scope.reverseSort = false;

    var i, j;

    function fetchBlock(blockNumber) {
      Block.fetchBlock(blockNumber).then(function(result) {
        $scope.status.open = [];
        for (i = 0; i < result.block.trxLength; i++) {
          $scope.status.open.push(false);
        }
        $scope.blk = result.block;
        $scope.nrTrx = result.block.trxLength;
        $scope.fees = result.fees;
        $scope.votes = result.votes;
        $scope.values = result.values;
        $scope.trxInfo = result.trxInfo;
        $scope.trx = $scope.blk.transactions;

        // FETCH ACCOUNT NAMES FOR UPDATES OR ASSET CREATIONS
        for (i = 0; i < $scope.trxInfo.length; i++) {
          if ($scope.trxInfo[i].trxCode >= 5 || $scope.trxInfo[i].trxCode <= 7) {
            for (j = 0; j < $scope.trx[i][1].trx.operations.length; j++) {
              if ($scope.trx[i][1].trx.operations[j].data.account_id) {
                getAccountName($scope.trx[i][1].trx.operations[j].data.account_id, i);
                break;
              }
              if ($scope.trx[i][1].trx.operations[j].data.issuer_account_id) {
                identifyAccount($scope.trx[i][1].trx.operations[j].data.issuer_account_id, i);
                break;
              }
            }
          }
        }
      });
    }

    $scope.sort = function(input) {
      $scope.orderByField = input;
      $scope.reverseSort = !$scope.reverseSort;
    };

    function identifyAccount(id, i) {
      Accounts.getAccountName(id).then(function(account) {
        $scope.issuerName[i] = account;
      });
    }

    function getAccountName(id, i) {
      Accounts.getAccountName(id).then(function(account) {
        $scope.trx[i][1].name = account;
      });
    }

    $scope.clickNext = function(blockNumber) {
      $scope.blockNumber = blockNumber;
      $location.search('id', blockNumber);
      fetchBlock(blockNumber);
    };

    fetchBlock($scope.blockNumber);

    function getTranslations() {
      Translate.trxTypes().then(function(result) {
        $scope.trxTypes = result;
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