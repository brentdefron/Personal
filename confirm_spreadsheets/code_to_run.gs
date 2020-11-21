/*
BFP Archived code
Table name:
Pipeline/process this was a part of: GOTV confirm spreadsheets
Author (or who future us should bother with questions): Sabrina Chern
code tldr; 
The code that actually wrote and formatted the data to the spreadsheets. There are multiple functions because writing to all the spreadsheets at once would have timed out the Google Apps Script. 
Also functions to collect the statuses from the spreadsheets to aggregate on the master spreadsheet to push to VAN at night, and functions to correct formatting (protections on the spreadsheet, and correcting the date on the "hub" sheet that we built).
*/ 

// master spreadsheet that has all the information that we want to parse out into different spreadsheets
INFO_SHEET = SpreadsheetApp.openById('1vpDcuFy-qOgZyucM2k2QkTVNaICj1jq0phCfyAoGShA');  

// global variables
VAN_LINK_INDEX = 0; 
VAN_ID_INDEX = 1; 
SHIFT_INDEX = 12; 


function test() { 
  // this is a function to test out formatting changes to a test spreadsheet that I access with the ID below -- for better explanation, refer to the actual function that was used
  
  var location = 'CV_Raleigh_SL102'; 
  var spreadsheet = SpreadsheetApp.openById('1kO35aUGAvekrDXG1k5kceQM4SGjbzh1mKtGhLkmkwxc'); // open test spreadsheet
  
  var sl_confirm_data_range = 'Confirms from Derived!P2:P'; // gets all SL names that have data
  var confirm_data_range = 'Confirms from Derived!A2:O'; // gets all data from master spreadsheet
  
  var sl_reshift_data_range = 'Reshifts from Derived!G2:G'; 
  var reshift_data_range = 'Reshifts from Derived!A2:F'; 
  
  var confirm_info_dict = getConfirmInfo(sl_confirm_data_range, confirm_data_range, INFO_SHEET); // all confirm data keyed by SL    
  var reshift_info_dict = getReshiftInfo(sl_reshift_data_range, reshift_data_range, INFO_SHEET); // all reshift data keyed by SL
  
  var confirm_headers = [['VAN ID', 'Event Signup ID', 'Name', 'Trained for canvassing?', 'Landline Phone', 'Cell Phone', 'Email', 'Shift this Weekend', 'Total Shifts this Weekend', 'Next Shift', 'Total Shifts After Today', 'Status', 'Status Last Updated', 'Trained for phonebanking?', 'Notes', 'Pass 1', 'Pass 2', 'Pass 3']];
  
  var reshift_headers = [['VAN ID','Name', 'Landline Phone', 'Cell Phone', 'Email', 'Reshifted?', 'Notes', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','', 
                          '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','9:00 AM','12:00 PM','3:00 PM', '6:00 PM', '7:00 AM', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','', 
                          'Date','9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', 'Other']]; 
  
  var walk_in_headers = [['Name', 'Phone', 'Email', 'Shift Date', 'Shift Time', 'Trained?', 'Reshifted?', 'Notes', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM', '',
                          '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','9:00 AM','12:00 PM','3:00 PM', '6:00 PM', '7:00 AM', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', '',
                          'Date','9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', 'Other']]; 
  
                          
  // dates for color coding volunteer shifts for confirm sheets
  var dates = []; 
  dates.push(new Date('October 24, 2020')); 
  dates.push(new Date('October 25, 2020')); 
  
  var is_van = false;
  var is_canvass = true; 
    
  var sheets = getSheets(spreadsheet); 
  clearConfirm(location, sheets); 
  clearReshift(location, sheets); 
  clearWalkIn(location, sheets); 

  populateConfirms(location, sheets, confirm_info_dict[location], confirm_headers, dates, is_van, is_canvass); 
  populateReshifts(location, sheets, reshift_info_dict[location], reshift_headers, is_van); 
  populateWalkIns(location, sheets, walk_in_headers, is_canvass); 
       
 
} 


function runCorrectDateOnHubSheet() { 

  let SL_names_range = 'SL Locations!A2:A'; // gets all SL names
  let SL_ids_range = 'SL Locations!B2:B'; // gets all SL ids
  
  var spreadsheets = makeSLDict(SL_names_range, SL_ids_range); // dictionary with all SLs and their corresponding spreadsheet key
  
  for (var location in spreadsheets) {
    
    Logger.log('starting for %s', location); 
    
    var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
    
    var hub_sheet = spreadsheet.getSheetByName('SL Overview'); 
    
    hub_sheet.getRange("B14").setFormula('=if(day(today())<=day("10/17/2020"),"10/17/2020","10/18/2020")');
    
    Logger.log('success for %s', location); 
  }
  
}


function correctSheetProtections() { 
    // change the protections on each spreadsheet
  
    let SL_names_range = 'SL Locations!A71:A'; // gets Canvassing SL names
    let SL_ids_range = 'SL Locations!B71:B'; // gets Canvassing SL IDs
    
    var spreadsheets = makeSLDict(SL_names_range, SL_ids_range); // dictionary with all SLs and their corresponding spreadsheet key

    for (var location in spreadsheets) { 
    
      var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
      
      // change protections on the hub sheet
      var hub_sheet = spreadsheet.getSheetByName('SL Overview'); 
      var hub_protections = hub_sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET); // get the current protections
      for (var i = 0; i < hub_protections.length; i++) {
        var me = Session.getEffectiveUser();
     
        var protection = hub_protections[i];
        protection.addEditor(me);
        
        protection.removeEditors(protection.getEditors());
        if (protection.canDomainEdit()) {
          protection.setDomainEdit(false); 
        }
      }
      
      // change protections on the confirm sheet
      var yesterday_confirm_sheet = spreadsheet.getSheetByName('Yesterday Confirms'); 
      var confirm_protections = yesterday_confirm_sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      for (var i = 0; i < confirm_protections.length; i++) {
        var me = Session.getEffectiveUser();
     
        var protection = confirm_protections[i];
        protection.addEditor(me);
        
        protection.removeEditors(protection.getEditors());
        if (protection.canDomainEdit()) {
          protection.setDomainEdit(false); 
        }
      }
      
      // change protections on the reshift sheet
       var yesterday_reshift_sheet = spreadsheet.getSheetByName('Yesterday Reshifts'); 
      var reshift_protections = yesterday_reshift_sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      for (var i = 0; i < reshift_protections.length; i++) {
        var me = Session.getEffectiveUser();
     
        var protection = reshift_protections[i];
        protection.addEditor(me);
        
        protection.removeEditors(protection.getEditors());
        if (protection.canDomainEdit()) {
          protection.setDomainEdit(false); 
        }
      }
    
    }
} 

 

function runCollectDataFromSheets() { 
  // at the end of the day, collect the changed statuses from each spreadsheet and write to one tab of the master sheet
  // then, we can import that data into CIVIS and push to VAN using the API

  Logger.log('runCollectDataFromSheets START'); 
  INFO_SHEET.getRange('Functions Control Panel!B11').setValue((new Date()).toString()); // logging that the function is running
  INFO_SHEET.getRange('Functions Control Panel!B13').setValue("Running");
  
  try { 
    // get the spreadsheet IDs to access and edit those spreadsheets
    let SL_names_range = 'SL Locations!A2:A81'; // gets Canvassing SL names
    let SL_ids_range = 'SL Locations!B2:B81'; // gets Canvassing SL IDs 
    
    var spreadsheets = makeSLDict(SL_names_range, SL_ids_range); // calls function that makes a dictionary with all SLs and their corresponding spreadsheet key
    
    // get sheet that we want to aggregate the data on-- a tab on the master spreadsheet named "CIVIS Export"
    var export_sheet = INFO_SHEET.getSheetByName('CIVIS Export');
    export_sheet.clear(); 
    export_sheet.getRange('A1:B1').setValues([['Event Signup ID', 'Status']]); // headers 
   
    for (var location in spreadsheets) { // for each spreadsheet or GOTV staging location
    
      var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
      var sheets = getSheets(spreadsheet); // get the references to the necessary sheets-- confirm sheet, reshift sheet, walk in sheet
      
      // copy over information from confirm and reshift sheets to the protected copy that organizers can reference the next day
      transferSheetToYesterday(location, spreadsheet, sheets);
      
      // get event signup ids and statuses (columns B and J), and filter for empty rows
      let data = []; 
      const event_signup_ids = sheets.confirm_sheet.getRange('B2:B').getValues().filter(function (el) { return el[0] != ''; });
      data = event_signup_ids; 
      const statuses = sheets.confirm_sheet.getRange('L2:L').getValues().filter(function (el) { return el[0] != ''; }); ; 
  
      if (event_signup_ids.length == statuses.length && data.length != 0) { // if no empty statuses
        // put columns B and K together into one array
        data.forEach((row, index) => { 
           row.push(statuses[index][0]);
         //row.push(location); 
        });  
        
        // write to master sheet
        export_sheet.getRange(export_sheet.getLastRow() + 1, 1, data.length, data[0].length).setValues(data); 
      } 
      else { 
        Logger.log('Number of event signup IDs and statuses is not the same'); 
      }  
    }
    
    INFO_SHEET.getRange('Functions Control Panel!B13').setValue("Success");
  }
  catch (err) { 
    INFO_SHEET.getRange('Functions Control Panel!B13').setValue("Error");
    throw(err); 
  } 
  
  Logger.log('runCollectDataFromSheets END'); 
}


function runClearDailySheets() { 
  
  // clear confirm and reshift sheets daily 
  
  Logger.log('runClearDailySheets() START'); 
  INFO_SHEET.getRange('Functions Control Panel!B18').setValue((new Date()).toString());
  INFO_SHEET.getRange('Functions Control Panel!B20').setValue("Running");
  
  try { 
    let SL_names_range = 'SL Locations!A2:A'; // gets Canvassing SL names
    let SL_ids_range = 'SL Locations!B2:B'; // gets Canvassing SL IDs
    
    var spreadsheets = makeSLDict(SL_names_range, SL_ids_range); // dictionary with all SLs and their corresponding spreadsheet key
    
    for (var location in spreadsheets) { 
      var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
      
      var sheets = getSheets(spreadsheet); 
      clearReshift(location, sheets); 
      clearConfirm(location, sheets); 
     
    } 
    
    // clear CIVIS export sheet
    var export_sheet = INFO_SHEET.getSheetByName('CIVIS Export');
    export_sheet.clear(); 
    
    INFO_SHEET.getRange('Functions Control Panel!B20').setValue("Success");
 
  }
  catch (err) { 
    INFO_SHEET.getRange('Functions Control Panel!B20').setValue("Error");
    throw(err); 
  } 
  
  Logger.log('clearDailySheets() END'); 

} 

function runClearAllSheets() { 
  // clear all sheets-- confirm, reshift, and walk in
  // not used daily because we did not clear the walk in sheet every day

  Logger.log('clearAllSheets() START'); 
  INFO_SHEET.getRange('Functions Control Panel!B24').setValue((new Date()).toString());
  INFO_SHEET.getRange('Functions Control Panel!B26').setValue("Running");
  
  try { 
    let SL_names_range = 'SL Locations!A2:A'; // gets Canvassing SL names
    let SL_ids_range = 'SL Locations!B2:B'; // gets Canvassing SL IDs
    
    var spreadsheets = makeSLDict(SL_names_range, SL_ids_range); // dictionary with all SLs and their corresponding spreadsheet key
    
    for (var location in spreadsheets) { 
      var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
      
      var sheets = getSheets(spreadsheet); 
      clearReshift(location, sheets); 
      clearConfirm(location, sheets); 
      clearWalkIn(location, sheets); 
     
    } 
    
    INFO_SHEET.getRange('Functions Control Panel!B26').setValue("Success");
 
  }
  catch (err) { 
    INFO_SHEET.getRange('Functions Control Panel!B26').setValue("Error");
    throw(err); 
  } 
  
  Logger.log('clearAllSheets() END'); 


}


function runWriteToSheetsVSL1() {  
  // write the data into the first half of the staging locations - about 35 spreadsheets 
  
  Logger.log('runWriteToSheetsVSL1 START'); 
  INFO_SHEET.getRange('Functions Control Panel!B4').setValue((new Date()).toString());
  INFO_SHEET.getRange('Functions Control Panel!B6').setValue("Running");
  
  var is_civis = true; // true if from CIVIS VAN tables, false if from BQ tables
  var is_van = false;  // true if we were using the van contingency plan
  var is_canvass = false; // not a canvassing location, so hide the "trained for canvassing?" column
  
  let import_date = INFO_SHEET.getRange('Civis Import Timestamp!A2').getValue().toDateString();
  let current_date = new Date().toDateString(); 
  
  if (import_date == current_date) { // if data was updated today
  
      try {
        let SL_names_range = 'SL Locations!A2:A35'; // gets first half of the VSL locations
        let SL_ids_range = 'SL Locations!B2:B35'; 
    
        var spreadsheets = makeSLDict(SL_names_range, SL_ids_range); // dictionary with all SLs and their corresponding spreadsheet key
    
        if (is_civis) { // if data from civis
          var sl_confirm_data_range = 'Confirms from Derived!O2:O'; // gets all SL names that have data
          var confirm_data_range = 'Confirms from Derived!A2:N'; // gets all data from master spreadsheet
          
          var sl_reshift_data_range = 'Reshifts from Derived!G2:G'; 
          var reshift_data_range = 'Reshifts from Derived!A2:F'; 
          Logger.log('Populate tables based on CIVIS VAN data'); 
        }
        if (!is_civis) { 
          var sl_data_range = 'Confirms from BQ!N2:N'; // gets all SL names that have data
          var confirm_data_range = 'Confirms from BQ!A2:M'; // gets all data from master spreadsheet
          Logger.log('Populate tables based on BQ VAN data'); 
        }
        
        var confirm_info_dict = getConfirmInfo(sl_confirm_data_range, confirm_data_range, INFO_SHEET); // all confirm data keyed by SL
        var reshift_info_dict = getReshiftInfo(sl_reshift_data_range, reshift_data_range, INFO_SHEET); // all reshift data keyed by SL
        
        // headers for the different sheets
         var confirm_headers = [['VAN ID', 'Event Signup ID', 'Name', 'Trained for canvassing?', 'Landline Phone', 'Cell Phone', 'Email', 'Shift this Weekend', 'Total Shifts this Weekend', 'Next Shift', 'Total Shifts After Today', 'Status', 'Status Last Updated', 'Trained for phonebanking?', 'Notes', 'Pass 1', 'Pass 2', 'Pass 3']];
  
         var reshift_headers = [['VAN ID','Name', 'Landline Phone', 'Cell Phone', 'Email', 'Reshifted?', 'Notes', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','', 
                          '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','9:00 AM','12:00 PM','3:00 PM', '6:00 PM', '7:00 AM', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','', 
                          'Date','9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', 'Other']]; 
  
         var walk_in_headers = [['Name', 'Phone', 'Email', 'Shift Date', 'Shift Time', 'Trained?', 'Reshifted?', 'Notes', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM', '',
                          '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','9:00 AM','12:00 PM','3:00 PM', '6:00 PM', '7:00 AM', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', '',
                          'Date','9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', 'Other']]; 
  
        // dates for color coding volunteer shifts for confirm sheets
        var dates = []; 
        dates.push(new Date('October 17, 2020')); 
        dates.push(new Date('October 18, 2020')); 
   
        for (var location in spreadsheets) { // for each spreadsheet corresponding to the first half of the VSL locations
          var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
          // spreadsheet.setSpreadsheetTimeZone('America/New_York');
        
          // call functions that clear spreadsheets and write the new information
          var sheets = getSheets(spreadsheet); 
          clearConfirm(location, sheets); 
          clearReshift(location, sheets); 
          //clearWalkIn(location, sheets); 
          populateConfirms(location, sheets, confirm_info_dict[location], confirm_headers, dates, is_van, is_canvass); 
          populateReshifts(location, sheets, reshift_info_dict[location], reshift_headers, is_van); 
          //populateWalkIns(location, sheets, walk_in_headers, is_canvass); 
         
       }
        
        INFO_SHEET.getRange('Functions Control Panel!B6').setValue('Success');
      }
      catch (err) { 
        INFO_SHEET.getRange('Functions Control Panel!B6').setValue('Error');
        throw(err);
      }
      
     
      
   } 
   else {  
     Logger.log('Data not updated'); 
     INFO_SHEET.getRange('Functions Control Panel!B6').setValue('Data not updated');
   }
  
   Logger.log('runWriteToSheetsVSL1 END'); 

}

function runWriteToSheetsVSL2() {  
  // populate second half of the VSL locations
  
  Logger.log('runWriteToSheetsVSL2 START'); 
  INFO_SHEET.getRange('Functions Control Panel!E4').setValue((new Date()).toString());
  INFO_SHEET.getRange('Functions Control Panel!E6').setValue("Running");
  
  var is_civis = true; // true if from CIVIS VAN tables, false if from BQ tables
  var is_van = false; 
  var is_canvass = false; 
  
  let import_date = INFO_SHEET.getRange('Civis Import Timestamp!A2').getValue().toDateString();
  let current_date = new Date().toDateString(); 
  
  if (import_date == current_date) { 
  
      try {
        let SL_names_range = 'SL Locations!A36:A70'; // gets VSL locations
        let SL_ids_range = 'SL Locations!B36:B70'; 
    
        var spreadsheets = makeSLDict(SL_names_range, SL_ids_range); // dictionary with all SLs and their corresponding spreadsheet key
    
        if (is_civis) { 
          var sl_confirm_data_range = 'Confirms from Derived!O2:O'; // gets all SL names that have data
          var confirm_data_range = 'Confirms from Derived!A2:N'; // gets all data from master spreadsheet
          
          var sl_reshift_data_range = 'Reshifts from Derived!G2:G'; 
          var reshift_data_range = 'Reshifts from Derived!A2:F'; 
          Logger.log('Populate tables based on CIVIS VAN data'); 
        }
        if (!is_civis) { 
          var sl_data_range = 'Confirms from BQ!N2:N'; // gets all SL names that have data
          var confirm_data_range = 'Confirms from BQ!A2:M'; // gets all data from master spreadsheet
          Logger.log('Populate tables based on BQ VAN data'); 
        }
        
        var confirm_info_dict = getConfirmInfo(sl_confirm_data_range, confirm_data_range, INFO_SHEET); // all confirm data keyed by SL
        var reshift_info_dict = getReshiftInfo(sl_reshift_data_range, reshift_data_range, INFO_SHEET); // all reshift data keyed by SL
        
        var confirm_headers = [['VAN ID', 'Event Signup ID', 'Name', 'Trained for canvassing?', 'Landline Phone', 'Cell Phone', 'Email', 'Shift this Weekend', 'Total Shifts this Weekend', 'Next Shift', 'Total Shifts After Today', 'Status', 'Status Last Updated', 'Trained for phonebanking?', 'Notes', 'Pass 1', 'Pass 2', 'Pass 3']];
  
        var reshift_headers = [['VAN ID','Name', 'Landline Phone', 'Cell Phone', 'Email', 'Reshifted?', 'Notes', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','', 
                          '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','9:00 AM','12:00 PM','3:00 PM', '6:00 PM', '7:00 AM', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','', 
                          'Date','9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', 'Other']]; 
  
        var walk_in_headers = [['Name', 'Phone', 'Email', 'Shift Date', 'Shift Time', 'Trained?', 'Reshifted?', 'Notes', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM', '',
                          '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','9:00 AM','12:00 PM','3:00 PM', '6:00 PM', '7:00 AM', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', '',
                          'Date','9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', 'Other']]; 
  
  
        
        // dates for color coding volunteer shifts for confirm sheets
        var dates = []; 
        dates.push(new Date('October 17, 2020')); 
        dates.push(new Date('October 18, 2020')); 
   
        for (var location in spreadsheets) { 
          var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
          // spreadsheet.setSpreadsheetTimeZone('America/New_York');
        
          var sheets = getSheets(spreadsheet); 
          clearConfirm(location, sheets); 
          clearReshift(location, sheets); 
          //clearWalkIn(location, sheets); 
          populateConfirms(location, sheets, confirm_info_dict[location], confirm_headers, dates, is_van, is_canvass); 
          populateReshifts(location, sheets, reshift_info_dict[location], reshift_headers, is_van); 
          //populateWalkIns(location, sheets, walk_in_headers, is_canvass); 
         
       }
        
        INFO_SHEET.getRange('Functions Control Panel!E6').setValue('Success');
      }
      catch (err) { 
        INFO_SHEET.getRange('Functions Control Panel!E6').setValue('Error');
        throw(err);
      }
      
     
      
   } 
   else {  
     Logger.log('Data not updated'); 
     INFO_SHEET.getRange('Functions Control Panel!E6').setValue('Data not updated');
   }
  
   Logger.log('runWriteToSheetsVSL2 END'); 

}


function runWriteToSheetsCanvass() {  
  // populate in person canvassing staging locations
  
  Logger.log('runWriteToSheetsCanvass START'); 
  INFO_SHEET.getRange('Functions Control Panel!H4').setValue((new Date()).toString());
  INFO_SHEET.getRange('Functions Control Panel!H6').setValue("Running");
  
  var is_civis = true; // true if from CIVIS VAN tables, false if from BQ tables
  var is_van = false; 
  var is_canvass = true; 
  
  let import_date = INFO_SHEET.getRange('Civis Import Timestamp!A2').getValue().toDateString();
  let current_date = new Date().toDateString(); 
  
  if (import_date == current_date) { 
  
      try {
        let SL_names_range = 'SL Locations!A71:A81'; // gets Canvassing SL names
        let SL_ids_range = 'SL Locations!B71:B81'; // gets Canvassing SL IDs
    
        var spreadsheets = makeSLDict(SL_names_range, SL_ids_range); // dictionary with all SLs and their corresponding spreadsheet key
    
        if (is_civis) { 
          var sl_confirm_data_range = 'Confirms from Derived!O2:O'; // gets all SL names that have data
          var confirm_data_range = 'Confirms from Derived!A2:N'; // gets all data from master spreadsheet
          
          var sl_reshift_data_range = 'Reshifts from Derived!G2:G'; 
          var reshift_data_range = 'Reshifts from Derived!A2:F'; 
          Logger.log('Populate tables based on CIVIS VAN data'); 
        }
        if (!is_civis) { 
          var sl_data_range = 'Confirms from BQ!N2:N'; // gets all SL names that have data
          var confirm_data_range = 'Confirms from BQ!A2:M'; // gets all data from master spreadsheet
          Logger.log('Populate tables based on BQ VAN data'); 
        }
        
        var confirm_info_dict = getConfirmInfo(sl_confirm_data_range, confirm_data_range, INFO_SHEET); // all confirm data keyed by SL
        var reshift_info_dict = getReshiftInfo(sl_reshift_data_range, reshift_data_range, INFO_SHEET); // all reshift data keyed by SL
        
        var confirm_headers = [['VAN ID', 'Event Signup ID', 'Name', 'Trained for canvassing?', 'Landline Phone', 'Cell Phone', 'Email', 'Shift this Weekend', 'Total Shifts this Weekend', 'Next Shift', 'Total Shifts After Today', 'Status', 'Status Last Updated', 'Trained for phonebanking?', 'Notes', 'Pass 1', 'Pass 2', 'Pass 3']];
  
        var reshift_headers = [['VAN ID','Name', 'Landline Phone', 'Cell Phone', 'Email', 'Reshifted?', 'Notes', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','', 
                          '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','9:00 AM','12:00 PM','3:00 PM', '6:00 PM', '7:00 AM', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','', 
                          'Date','9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', 'Other']]; 
  
        var walk_in_headers = [['Name', 'Phone', 'Email', 'Shift Date', 'Shift Time', 'Trained?', 'Reshifted?', 'Notes', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM', '',
                          '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM','12:00 PM','3:00 PM', '6:00 PM','9:00 AM','12:00 PM','3:00 PM', '6:00 PM', '7:00 AM', '9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', '',
                          'Date','9:00 AM', '12:00 PM','3:00 PM', '6:00 PM', 'Other']]; 
  
        
        // dates for color coding volunteer shifts for confirm sheets
        var dates = []; 
        dates.push(new Date('October 17, 2020')); 
        dates.push(new Date('October 18, 2020')); 
   
        for (var location in spreadsheets) { 
          var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
          // spreadsheet.setSpreadsheetTimeZone('America/New_York');
        
          var sheets = getSheets(spreadsheet); 
          clearConfirm(location, sheets); 
          clearReshift(location, sheets); 
          //clearWalkIn(location, sheets); 
          populateConfirms(location, sheets, confirm_info_dict[location], confirm_headers, dates, is_van, is_canvass); 
          populateReshifts(location, sheets, reshift_info_dict[location], reshift_headers, is_van); 
          //populateWalkIns(location, sheets, walk_in_headers, is_canvass); 
         
       }
        
        INFO_SHEET.getRange('Functions Control Panel!H6').setValue('Success');
      }
      catch (err) { 
        INFO_SHEET.getRange('Functions Control Panel!H6').setValue('Error');
        throw(err);
      }
   } 
   else {  
     Logger.log('Data not updated'); 
     INFO_SHEET.getRange('Functions Control Panel!H6').setValue('Data not updated');
   }
  
   Logger.log('runWriteToSheetsCanvass END'); 
}
