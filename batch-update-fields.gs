var API_KEY = "Bearer YOUR_API_KEY";
var DEBUG = false;

function makeRequest(url, settings) {
  var response = UrlFetchApp.fetch(url, settings);
  var responseCode = response.getResponseCode();
  var responseBody = response.getContentText();

  if (responseCode === 200) {
    // Possibly write another test to see if the call returns an empty item
    Logger.log(Utilities.formatString("Success. %s\n", responseBody));
    return responseBody;
  } else {
    Logger.log(Utilities.formatString("Request failed. Expected 200, got %d: %s\n", responseCode, responseBody));
    return false;
  }
}

function searchBase(recordType, email) {
  Logger.log("Searching for " + email + " in " + recordType);

  var url = "https://api.getbase.com/v2/" + recordType + "?email=" + email;
  var settings = {
    "method": "GET",
    "headers": {
      "authorization": API_KEY,
      "accept": "application/json"
    },
    "verify": true,
    "muteHttpExceptions": true
  };

  var response = makeRequest(url, settings);
  if (response) {
    if (response.indexOf("created_at") !== -1) {
      Logger.log("Found in " + recordType + "\n");
      var id = response.split("{\"id\":")[1].split(",")[0];
      return id;
    }
  }
  return false;
}

function updateRecord(recordId, recordType, fieldName, fieldValue) {
  if (!recordId) {
    return false;
  }
  Logger.log("Updating record " + fieldName + " with " + fieldValue);
  var url = "https://api.getbase.com/v2/" + recordType + "/" + recordId;
  var payload = {
    "data": {
      "custom_fields": {}
    }
  };
  payload.data.custom_fields[fieldName] = fieldValue;

  var settings = {
    "method": "PUT",
    "headers": {
      "authorization": API_KEY,
      "accept": "application/json",
      "content-type": "application/json",
    },
    "verify": true,
    "muteHttpExceptions": true
  };
  settings.payload = JSON.stringify(payload);

  return makeRequest(url, settings);
}

function updateRecords() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();

  var fieldName = sheet.getRange("C1").getValue();

  for (var i = 1; i < data.length; i++) {
    var email = data[i][0];
    var rowNumber = (i + 1).toString();
    var leadId = searchBase("leads", email);
    var contactId = searchBase("contacts", email);
    var outputCell = "B" + rowNumber;

    if (!leadId && !contactId) {
      sheet.getRange(outputCell).setValue('record not found');
      continue;
    }

    var fieldValue = sheet.getRange("C" + rowNumber).getValue();

    var updatedLead = updateRecord(leadId, "leads", fieldName, fieldValue);
    var updatedContact = updateRecord(contactId, "contacts", fieldName, fieldValue);

    if (updatedLead && updatedContact) {
      var outputMessage = "updated lead and contact"
    } else if (updatedLead) {
      var outputMessage = "updated lead"
    } else if (updatedContact) {
      var outputMessage = "updated contact"
    } else {
      var outputMessage = "failed to update record (please check logs)"
    }
    sheet.getRange(outputCell).setValue(outputMessage);
  }
}
