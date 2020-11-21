/*
BFP Archived code
Table name: N/A
Pipeline/process this was a part of: Daily emails to organizers, RODs, and DODs with metrics from the previous day
Author: Sabrina Chern
code tldr: The functions that are named run...Export() run the actual sending of the emails. The other functions create time-based triggers for the emails to send, or calculate how many automated emails your account has left in the day.
code feelings: We collected all the information and sent all the emails in one function. If there were more organizers (we had 170), the function could have timed out on Google Apps Script. A bit unwieldy if you needed to scale up. 
*/


// global variables

// Excel sheet where all data is stored
var SHEET = SpreadsheetApp.openById('1gTaLqlk7uUCQuzDkTO-6KJnVv7H1t3yNlEGL4MwDbg4');

// the information that was sent to each organizer is keyed by their code (ex. 01B)
// these are the indices, or columns, that the code was stored in on the master spreadsheet so we could pull the correct information for each organizer
var FO_CODE_INDEX = 5; 
var SHIFTS_FO_CODE_INDEX = 6;
var DROPPED_FO_CODE_INDEX = 7; 

// which column to stop collecting information for
// the dialer information had 5 columns, so the index to stop is at 4 (0, 1, 2, 3, 4)
var DIALER_INDEX_STOP = 4; 
var TEXT_INDEX_STOP = 4; 
var VPB_INDEX_STOP = 4; 
var SHIFT_INDEX_STOP = 5; 
var ACTIVES_INDEX_STOP = 4;
var DROPPED_INDEX_STOP = 6; 

// the information for organizers was stored in a dictionary that used the turf code (ex. 01B) as the key, and the information for each organizer was kept in an array 
// ex. {01B: [Sabrina Chern, sabrina.chern@2020victory.com, Brent Efron, 100, 10, 1, 2, 3, 4], 01C: [Jeff Rose, jeff.rose@2020victory.com, Brent Efron, 120, 1, 1, 1, 1, 1].....} 
// these are the indices for those pieces of information stored in each organizer's array
var ORGINFO_NAME = 0; 
var ORGINFO_EMAIL = 1; 
var ORGINFO_ROD = 2; 
var ORGINFO_DIALS = 3; 
var ORGINFO_ACTIVES = 4; 
var ORGINFO_ACTIVES_NOT_SCHEDULED = 5; 
var ORGINFO_OPEN_SHIFTS = 6;
var ORGINFO_VOL_CONFIRMED = 7; 
var ORGINFO_VOL_TESTING = 8; 

// similar to the way that information was stored for the organizer's information array above, these are the indices for each region
var PODINFO_REGION = 0; 
var PODINFO_ROD = 1; 
var PODINFO_DOD = 2; 
var PODINFO_KEY = 3; 
var PODINFO_CALLS = 4; 
var PODINFO_SHIFTS_SCHED = 5; 
var PODINFO_SHIFTS_COMPL = 6; 


// how many more automated emails you can send before google apps boots you off for the day
function emailsLeft() { 
  var emailQuotaRemaining = MailApp.getRemainingDailyQuota();
  Logger.log("Remaining email quota: " + emailQuotaRemaining);
}


// time based triggers
function createRODTrigger() {
  ScriptApp.newTrigger("runRODEmailExport")
     .timeBased()
     .atHour(2)
     .nearMinute(45)
     .everyDays(1) // Frequency is required if you are using atHour() or nearMinute()
     .create();
}

function createAmandaTrigger() { // a compiled list of all the regional stats for the organizing director
  ScriptApp.newTrigger("runAmandaEmailExport")
     .timeBased()
     .atHour(2)
     .nearMinute(45)
     .everyDays(1) // Frequency is required if you are using atHour() or nearMinute()
     .create();
}

function createOrgTrigger() {
  ScriptApp.newTrigger("runOrgEmailExport")
    .timeBased()
    .atHour(3)
    .nearMinute(0)
    .everyDays(1) // Frequency is required if you are using atHour() or nearMinute()
    .create();
}

// runs the email export for the organizing director
function runAmandaEmailExport() { 
  Logger.log('Beginning runAmandaEmailExport()'); 
  SHEET.getRange('Control Panel!B16').setValue((new Date()).toString());  // logging that the function is running onto a control panel tab of the spreadsheet
  SHEET.getRange('Control Panel!B18').setValue("Running");

  pods_info_range = 'ROD/DOD Export!A2:M'; // range with data to put into the table in the email
  // headers for the table in the email
  let headers = ['Region','Recruitment Calls','Shifts Scheduled', 'Shifts Completed', 'Dropped Shifts', 'Same-Day Confirm Rate', 'Reshift Rate: All Shifts', 'Reshift Rate: Shifts Scheduled Same Day', 'People Not Reshifted Yesterday', '% of People Not Reshifted Yesterday'];

  let van_sync = SHEET.getRange('Timestamp!A2').getValue().toDateString(); // date when data was updated on master spreadsheet
  let current_date = new Date().toDateString(); 
  
  if (van_sync == current_date) { // make sure the data was updated today
    try {
      pods_array = ['Far West', 'West', 'Triangle', 'East']; // keys for the dictionary
      pods_info = getPodsInfo(pods_array, pods_info_range); // dictionary for each region, keyed by the elements above
      
      var html_body = []; // variable to store the html for the email

      for(var key in pods_info) {
        getAmandaEmailBody(html_body, key, pods_info[key], headers); // get the html for each region
      }
      
      html_body = html_body.join('\n');
      
      sendEmailForAmanda(html_body); // call function that will actually send the email to organizing director
  
      SHEET.getRange('Control Panel!B18').setValue('Success');
    }
  
    catch(err) {
      SHEET.getRange('Control Panel!B18').setValue('Error');
      throw(err);
    }
  }
  else {
     Logger.log('Data not updated'); 
     SHEET.getRange('Control Panel!B18').setValue('Data not updated');
  }
  
  Logger.log('END runAmandaEmailExport()');
}

// run email export for 4 groups of regions across the state
function runRODEmailExport() {
  Logger.log('Beginning runRODEmailExport()');
  SHEET.getRange('Control Panel!B9').setValue((new Date()).toString()); // logging that the function is running onto a control panel tab of the spreadsheet
  SHEET.getRange('Control Panel!B11').setValue("Running");
  
  // Excel ranges that hold the information we want to send in the email
  pods_info_range = 'ROD/DOD Export!A2:M'; 
  
  // headers for the table in the email
  let headers = ['Region','Recruitment Calls','Shifts Scheduled', 'Shifts Completed', 'Dropped Shifts', 'Same-Day Confirm Rate', 'Reshift Rate: All Shifts', 'Reshift Rate: Shifts Scheduled Same Day', 'People Not Reshifted Yesterday', '% of People Not Reshifted Yesterday'];
  
  let van_sync = SHEET.getRange('Timestamp!A2').getValue().toDateString();
  let current_date = new Date().toDateString(); 
  
  if (van_sync == current_date) {
    try {
      pods_array = ['Far West', 'West', 'Triangle', 'East']; 
      pods_info = getPodsInfo(pods_array, pods_info_range); 
      
      for(var key in pods_info) {
        Logger.log(pods_info[key]); 
        sendEmailForPod(key, pods_info[key], headers); // call function that sends for each pod's information
      }
  
      SHEET.getRange('Control Panel!B11').setValue('Success');
    }
  
    catch(err) {
      SHEET.getRange('Control Panel!B11').setValue('Error');
      throw(err);
    }
  }
  else {
     Logger.log('Data not updated'); 
     SHEET.getRange('Control Panel!B11').setValue('Data not updated');
  }
  
  Logger.log('END runRODEmailExport()');
}


// run email export for each individual organizer (170 in our case)
function runOrgEmailExport() {
  Logger.log('Beginning runOrgEmailExport()');
  SHEET.getRange('Control Panel!B2').setValue((new Date()).toString());
  SHEET.getRange('Control Panel!B4').setValue("Running");
  
  // Excel ranges for all functions
  org_codes_range = 'Organizer Export!B3:B'; // column with all the organizer's codes
  org_info_range = 'Organizer Export!B3:K';  // range with all the organizer's information (names, number of dials made, 
  
  // ranges where the data is stored
  dialer_range = 'Dialer Export!A2:F';
  text_range = 'Text Export!A2:F';
  vpb_range = 'VPB Export!A2:F';
  shift_range = 'Shifts Scheduled Export!A2:G';
  actives_range = 'Active Export!A2:G'; 
  dropped_range = 'Dropped Shifts Export!A2:I'; 
  
  // for testing purposes 
  /*dialer_range = 'Dialer Export Test!A2:F';
  text_range = 'Text Export Test!A2:F';
  vpb_range = 'VPB Export Test!A2:F';
  shift_range = 'Shifts Scheduled Export Test!A2:G';
  actives_range = 'Active Export Test!A2:G'; 
  dropped_range = 'Dropped Shifts Export Test!A2:I'; */
  
  // combining the ranges to pass into one function
  all_range = {dialer_range, text_range, vpb_range, shift_range, actives_range, dropped_range}; 
  
  // the headers for the tables in the email
  dialer_headers = ['VANID', 'First Name', 'Last Name', 'Minutes on Dialer'];
  text_headers = ['VANID', 'First Name', 'Last Name', 'Texts Sent'];
  vpb_headers = ['VANID', 'First Name', 'Last Name', 'Calls Made']; 
  shift_headers = ['VANID', 'First Name', 'Last Name', 'Event Name', 'Event Date']; //'Shifts Scheduled Test!A1:G1'; 
  actives_headers = ['VANID', 'First Name', 'Last Name', 'Dropping on']; 
  dropped_headers = ['VANID', 'First Name', 'Last Name', 'Event Name', 'Event Role','Event Date'];
  all_headers = {dialer_headers, text_headers, vpb_headers, shift_headers, actives_headers, dropped_headers}; // combining the headers into one object
  
  let van_sync = SHEET.getRange('Timestamp!A2').getValue().toDateString();
  let current_date = new Date().toDateString(); 
  
  if (van_sync == current_date) {
   try {
      orgs_array = getOrgsArray(org_codes_range);  // get array of organizer codes ex. [01A, 01B, 01C,.... 22E]
      orgs_info = getOrgInfo(orgs_array, org_info_range); // dictionary of organizer information ex. {01A: [Sabrina Chern, ....], 01B: [Brent Efron, ...]} 
      // dictionary with all other information (dialer, text, VPB) 
      // ex. all_data.dialer_dict = {01A: [[Volunteer 1, # of minutes on dialer], [Volunteer 2, # of minutes on dialer]], 01B: [[Volunteer 1, # of minutes on dialer], [Volunteer 2, # of minutes on dialer]]}
      // ex. all_data.text_dict = {01A: [[Volunteer 1, # of texts sent], [Volunteer 2, # of texts sent]], 01B: [[Volunteer 1, # of texts sent], [Volunteer 2, # of texts sent]]}
      all_data = getAllData(orgs_array, orgs_info, all_range); 
      
      for(var key in orgs_info) { // loop through each organizer
        if (orgs_info[key][ORGINFO_EMAIL]) { // if the organizer has an email
          sendEmailForOrg(key, orgs_info[key], all_data.dialer_dict[key], all_data.text_dict[key], all_data.vpb_dict[key], all_data.shift_dict[key], all_data.actives_dict[key], all_data.dropped_dict[key], all_headers); 
        }
      }
  
      SHEET.getRange('Control Panel!B4').setValue('Success');
    }
  
    catch(err) {
      SHEET.getRange('Control Panel!B4').setValue('Error');
      throw(err);
    }
  }
  else {
     Logger.log('Data not updated'); 
     SHEET.getRange('Control Panel!B4').setValue('Data not updated');
  }
  
  Logger.log('END runOrgEmailExport()');
}
