function main() {
    var spreadsheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1jjwlZrxBicnD6Lq7hIxgoMx4fZUtLB3UTXrjOBxsVmo/edit?usp=sharing");
    var sheet = spreadsheet.getSheets()[0];

    var headersRange = sheet.getRange("A1:D1");
    var headers = [["Account Name", "Ad Status", "Disapproval Reasons", "Ad Type"]]
    headersRange.setValues(headers);

    var accountSelector = MccApp
        .accounts()
        .withCondition("LabelNames CONTAINS 'iHeart'")
        .forDateRange("TODAY")
        .withLimit(50);

    var accountIterator = accountSelector.get();

    while(accountIterator.hasNext()) {
        var account = accountIterator.next();
        var accountName = account.getName();
            Logger.log("Account being processed")

        MccApp.select(account);

        var adSelector = AdWordsApp
            .ads()
            .withCondition("Status = ENABLED")
            .withCondition("ApprovalStatus = DISAPPROVED");
    
        var adIterator = adSelector.get();
        
        
        // Loop over and log out the information for disapproved ads
        while(adIterator.hasNext()) {
            var ads = adIterator.next();
            var disapprovedArray = [];
            Logger.log("Account Flagged: " + currentAccountName);
            Logger.log("Ad Status: " + ads.getApprovalStatus());
            Logger.log("Ad Disapproval Reasons: " + ads.getDisapprovalReasons());
            Logger.log("Ad Type: " + ads.getType());
            Logger.log("================================================");
  
            // var accountObj = {
            //     name: currentAccountName,
            //     status: ads.getApprovalStatus(),
            //     reasons: ads.getDisapprovalReasons(),
            //     type: ads.getType()
            // };
            var currentAccountName = currentAccountName;
            var currentadStatus = ads.getApprovalStatus();
            var disapprovalReasons = ads.getDisapprovalReasons();
            var currentadType = ads.getType(); 
            disapprovedArray.push(currentAccountName, currentadStatus, disapprovalReasons, currentadType); 
            
            sheet.appendRow([disapprovedArray]);
        };
    }
}