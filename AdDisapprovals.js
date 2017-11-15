// 1. Ad disapprovals - email with a list of all accounts with number of ads disapproved

// ======================================= Ad Disapproval Account Script =====================================


// Psuedo-code
// Get all accounts in parallel
// Get all campaigns from the account
// Look at all the campaign ads
// Conditional to check if the account has a disapproved status
  // If it does - send a notification
  // Else move on

// AdWordsApp.AdGroup.getApprovalStatus();

function updateAccountsInParallel() {
  // You can use this approach when you have a large amount of processing
  // to do in each of your client accounts.

  // Select the accounts to be processed. You can process up to 50 accounts.
  var accountSelector = MccApp.accounts()
      .withCondition("Account Type?")
      .withLimit(50);

  // Process the account in parallel. The callback method is optional.
  accountSelector.executeInParallel('processAccount', 'allFinished');
}

function processAccount() {

  var account = AdWordsApp.currentAccount();
  var campaignIterator = AdWordsApp.campaigns()
      .get();

  while (campaignIterator.hasNext()) {
    var campaign = campaignIterator.next();
    Logger.log('Campaign Name: '+ campaign.getName() + "Account ID: " + 
        account.getCustomerId());
  }
  return campaignIterator.totalNumEntities().toFixed(0);
}

function allFinished(results) {
  for (var i = 0; i < results.length; i++) {
    // Get the ExecutionResult for an account.
    var result = results[i];

    Logger.log('Customer ID: %s; status = %s.', result.getCustomerId(),
        result.getStatus());

    // Check the execution status. This can be one of ERROR, OK, or TIMEOUT.
    if (result.getStatus() == 'ERROR') {
      Logger.log("-- Failed with error: '%s'.", result.getError());
    } else if (result.getStatus() == 'OK') {
      var retval = result.getReturnValue();
      Logger.log('--Processed %s campaigns.', retval);
    } else {
      // Handle timeouts here.
    }
  }
}