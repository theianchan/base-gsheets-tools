var API_KEY = "Bearer YOUR_API_KEY";
var DEBUG = false;

var SETTINGS = {
  "async": true,
  "crossDomain": true,
  "method": "GET",
  "headers": {
    "authorization": API_KEY,
    "accept": "application/json",
    "cache-control": "no-cache"
  }
};

function searchBase(recordType, email) {
  var url = "https://api.getbase.com/v2/" + recordType + "?email=" + email;
  var response = UrlFetchApp.fetch(url, SETTINGS).getContentText();

  Logger.log("searching " + recordType + " for " + email);
  if (DEBUG) {
    Logger.log("/" + recordType + "/\n" + response);
  }
  if (response.indexOf("created_at") !== -1) {
    Logger.log("found in " + recordType + "\n");
    var id = response.split("{\"id\":")[1].split(",")[0];
    return id;
  }
  return false;
}

function displayRecord(recordId, recordType, outputCell, outputSheet) {
  if (recordId) {
    var url = "https://app.futuresimple.com/" + recordType + "/" + recordId;
    outputSheet.getRange(outputCell).setValue(url);
  }
  return;
}

function lookupEmails() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var email = data[i][0];

    var leadId = searchBase("leads", email);
    displayRecord(leadId, "leads", "B" + ((i + 1).toString()), sheet);

    var contactId = searchBase("contacts", email);
    displayRecord(contactId, "contacts", "C" + ((i + 1).toString()), sheet);

    if (!leadId && !contactId) {
      var outputCell = "D" + ((i + 1).toString());
      sheet.getRange(outputCell).setValue('not found');
      Logger.log("not found\n");
    }
  }
}
