var SCRIPT_LABEL = 'CMS-IYP';

function run() {
  // your script goes here
  var currentAccount = AdWordsAp.currentAccount();
  var currentAccountName = currentAccount.getName();
  Logger.log("Looking at this account: " + currentAccountName);
      var adSelector = AdWordsAp
          .ads()
          .withCondition("Status = ENABLED")
          .withCondition("ApprovalStatus = DISAPPROVED");
  
      var adIterator = adSelector.get();
  
      // Loop over and log out the information for disapproved ads
      while(adIterator.hasNext()) {
          var ads = adIterator.next();
          Logger.log("Account Flagged: " + currentAccountName);
          Logger.log("Ad Status: " + ads.getApprovalStatus());
          Logger.log("Ad Disapproval Reasons: " + ads.getDisapprovalReasons());
          Logger.log("Ad Type: " + ads.getType());
          Logger.log("================================================");
      };
}

// this will execute your script sequentially accounts and is only used for accounts in excess of 50
function executeInSequence(sequentialIds, executeSequentiallyFunc) {
    sequentialIds.forEach(function (accountId) {
        var account = MccApp.accounts().withIds([accountId]).get().next();
        MccApp.select(account);
        executeSequentiallyFunc();
    });
}

// our custom main function responsible for executing the run function
function main() {
    try {
        var accountSelector = MccApp.accounts().orderBy('Name');
        if (SCRIPT_LABEL) {
            accountSelector = accountSelector.withCondition("LabelNames CONTAINS '" + SCRIPT_LABEL + "'");
        }
        var accountIterator = accountSelector.get();
        var accountIds = [];
        while (accountIterator.hasNext()) {
            var account = accountIterator.next();
            accountIds.push(account.getCustomerId());
        }
        var parallelIds = accountIds.slice(0, 50);
        var sequentialIds = accountIds.slice(50);
        MccApp.accounts()
            .withIds(parallelIds)
            .executeInParallel('run');
        if (sequentialIds.length > 0) {
            executeInSequence(sequentialIds, run);
        }
    }
    catch (exception) {
        Logger.log('Running on non-MCC account.');
        run();
    }
}