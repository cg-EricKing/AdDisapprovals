// MCC Ad Disapproval Script
// Iterate over an account type and check if the account has a campaign
// with disapproved ads

    // Globals

    // name for notification - logs
    var scriptName = 'MCC Disapproval app';
    // specify timezone
    var timezone = 'EST';
    // stringify the current date
    var todayString = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');
    // label to add to keep script running
    var labelPrefix = scriptName + ' == Completed == ';
    var finishedLabelName = labelPrefix + todayString;
    // provide email for notification
    var notify = ['email@email.com'];


// main function

function main () {

    // run the function to create a label after looking at account
    createLabelIfNeeded();
    // run the function to remove a label with a date from yesterday
    removeYesterdaysLabel();
    // Iterate over the accounts - looking at the conditions
    var accountIterator = MccApp.accounts()
    // adds a condition to a selector. 
    // If multiple conditions are used, they are AND-ed together, in other words, the selector will only return entities that satisfy all of the specified conditions.
        .withCondition("Name CONTAINS 'ACCOUNT LABEL'")
        .withCondition("Name DOES_NOT_CONTAIN '"+ finishedLabelName+"'")
        .withCondition("Impressions > 1")
        .forDateRange("THIS_MONTH")
        // max limit of MccApp
        .withLimit(50)
        .get();

    // set up array to store accounts for adding labels
    var accountList = [];
    while(accountIterator.hasNext()) {
        var account = accountIterator.next();
        accountList.push(account.getCustomerId());
    }
    // conditional to check that we have accounts in the array and if we do run the execute in parallel functions
    if(accountList.length > 0) {
        MccApp.accounts()
        .withIds(accountList)
        .executeInParallel('lookForDisapprovals', 'reportOnResults')
    }
}
// function to look at the ads for each account and check for disaproved ads - right now just logs them.
function lookForDisapprovals() {
    var currentAccount = AdWordsAp.currentAccount();

    var adSelector = AdWordsAp
        .ads()
        .withCondition("ApprovalStatus = DISAPPROVED");

    var adIterator = adSelector.get();
    // This would food the Logs window
    // Logger.log("Total ads found: " + adIterator.totalNumEntities());

    // Loop over and log out the information for disapproved ads
    while(adIterator.hasNext()) {
        var ads = adIterator.next();
        Logger.log("Ad Status: " + ads.getApprovalStatus());
        Logger.log("Ad Disapproval Reasons: " + ads.getDisapprovalReasons());
        Logger.log("Ad Type: " + ads.getType());
        // Remove the ads
        // ad.remove();
        Logger.log("================================================");
    }


    return JSON.stringify({something:'else'});
}
// function to put ids in two array = one for ok status and one for errors - use to generate email report
// run the apply label to completed accounts function and push in the ids of the accounts without errors
// run the notifyerrors function and add the error accounts to send the email notification
function reportOnResults(results) {
    var completedAccounts = [];
    var errorOnTheseAccounts = [];

    for(var i in results) {
        var result = results[i];

        if(result.getStatus() == 'OK') {
            completedAccounts.push(result.getCustomerId());
            var returnedValue = JSON.parse(result.getReturnedValue());
        } else {
            errorOnTheseAccounts.push({getCustomerId:result.getCustomerId(), error: result.getError()});

        }
    }

    applyLabelsToCompletedAccounts(completedAccounts);

    notifyOfAccountsWithErrors(errorOnTheseAccounts);
}

// helper function to create the label using the global variable - just creates the label
function createLabelIfNeeded() {
    try {
        var labelIterator = MccApp.accountLabels()
            .withCondition("Name DOES_NOT_CONTAIN '"+finishedLabelName+"'")
            .get();
    } catch(e) {
        MccApp.createAccountLabel(finishedLabelName);
    }
}
// function to apply the label upon completing an account query
function applyLabelsToCompletedAccounts(completedAccounts) {
    var finishedAccountsIterator = MccApp.accounts().withIds(completedAccounts).get();
    while(finishedAccountsIterator.hasNext()){
        var account = finishedAccountsIterator.next();
        account.applyLabel(finishedLabelName);
    }
}
// look for yesterday's date labels and remove them
function removeYesterdaysLabel() {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = Utilities.formatDate(yesterday, timezone, 'yyyy-MM-dd');
    var yesterdayLabel = LABEL_PREFIX + yesterdayStr;
    Logger.log('Attempting to remove label: ' + yesterdayLabel);

    try {
        var labelIter = MccApp.accountLabels()
        .withCondition("Name CONTAINS '"+yesterdayLabel+"'")
        .get();
        
        while(labelIter.hasNext()) {
          labelIter.next().remove();
        }
      } catch(e) { 
        // do nothing
        Logger.log(e);
      }    
}

// This function will send an email to each email in the
// notify list from the top of the script with the specific error
function notifyOfAccountsWithErrors(errorOnTheseAccounts) {
    if(!errorOnTheseAccounts || errorOnTheseAccounts.length == 0) { return; }
    if(typeof notify == 'undefined') { throw 'notify is not defined.'; }
    var subject = scriptName +' - Accounts with Errors - '+ todayString;
     
    var htmlBody = 'The following Accounts had errors on the last run.<br / >';
    htmlBody += 'Log in to AdWords: http://goo.gl/7mS6A';
    var body = htmlBody;
    htmlBody += '<br / ><br / >';
    htmlBody += '<table border="1" width="95%" style="border-collapse:collapse;">' +
                '<tr><td>Account Id</td><td>Error</td></tr>';
    for(var i in errorOnTheseAccounts) {
      htmlBody += '<tr><td>'+ errorOnTheseAccounts[i].customerId +
        '</td><td>' + errorOnTheseAccounts[i].error + '</td></tr>';
    }
    htmlBody += '</table>';
    var options = { htmlBody : htmlBody };
    for(var i in notify) {
      Logger.log('Sending email to: '+notify[i]+' with subject: '+subject);
      MailApp.sendEmail(notify[i], subject, body, options);
    }
}