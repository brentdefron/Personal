/*
A contigency plan in case Redshift or BigQuery was down. Took a CSV export from VAN and populated the confirm spreadsheets with that (more limited) information.
*/ 

VAN_SHEET = SpreadsheetApp.openById('1OrgEJ0iumA6Z1-AB7WWjCQdwilICIc44jpeyOPFxKVg');

SHIFT_START = 4; 

function runVANWriteToSheets() { 

  Logger.log('runVANWriteToSheets START'); 
  
  processVANInfo(); 
  formatVANInfo(); 
  
  var is_van = true; 
    
  let SL_range = 'SL Locations!E2:E'; // gets all SL names
  var SL_array = getSLNamesArray(SL_range, INFO_SHEET); 
  var SL_dict = makeSLDict(SL_array); // empty dictionary with all SLs
  
  var spreadsheets = findSLSpreadsheets(SL_dict); // populated dictionary with SLs and their corresponding spreadsheets
  
  var sl_data_range = 'Display shifts!L2:L'; // gets all SL names that have data
  var data_range = 'Display shifts!A2:K'; // gets all data from master spreadsheet

  var confirm_info_dict = getConfirmInfo(sl_data_range, data_range, VAN_SHEET); // all data keyed by SL
  
  var confirm_headers = [['VAN ID', 'Event Signup ID', 'Name', 'Landline Phone', 'Preferred Phone (usually cell)', 'Shift this Weekend', 'Total Shifts this Weekend', 'Next Shift', 'Total Shifts After Today', 'Status', 'Re-shifts (Date and Time)', 'Notes', 'Pass 1', 'Pass 2', 'Pass 3']];
  var walk_in_headers = [['Name', 'Phone', 'Shift Date', 'Shift Time', 'Re-shifts (Date and Time)', 'Notes']];

  // dates for color coding volunteer shifts 
  const sat_date = new Date('October 10, 2020'); 
  const sun_date = new Date('October 11, 2020'); 
  var dates = []; 
  dates.push(sat_date); 
  dates.push(sun_date); 
  
  for (var location in spreadsheets) { 
    var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
    spreadsheet.setSpreadsheetTimeZone('America/New_York');
    
    if (confirm_info_dict[location] != null) { 
    
      var sheets = getSheets(spreadsheet); 
      clearSpreadsheet(location, sheets); 
      populateConfirms(location, sheets, confirm_info_dict[location], confirm_headers, walk_in_headers, dates, is_van); 

    } 
  } 
  
  Logger.log('runVANWriteToSheets END');

}

function formatVANInfo() {

  Logger.log('formatVANInfo START'); 
  
  VAN_SHEET.setSpreadsheetTimeZone('America/New_York');
  
  var all_shifts_sheet = VAN_SHEET.getSheetByName('All shifts'); 
  var display_shifts_sheet = VAN_SHEET.getSheetByName('Display shifts'); 
  
  // rearrange name text in column B
  var names = display_shifts_sheet.getRange('B2:B').getValues().filter(function (el) { return el[0] != ''; });

  for(var i = 0; i < names.length; i++) {
    var [last, first] = names[i][0].split(", "); 
    names[i][0] = first + " " + last; 
  }

  display_shifts_sheet.getRange(2, 2, names.length, names[0].length).setValues(names);
  
  // add empty event signup id column
  display_shifts_sheet.insertColumns(2); 
  display_shifts_sheet.getRange('B1').setValue('Event Signup Id'); 
  
  // add empty van obfuscate column 
  display_shifts_sheet.insertColumns(1); 
  display_shifts_sheet.getRange('A1').setValue('van obfuscate'); 
  
  Logger.log('formatVANInfo END'); 
} 

function processVANInfo() {

  Logger.log('processVanInfo START'); 

  var all_shifts_sheet = VAN_SHEET.getSheetByName('All shifts'); 
  var display_shifts_sheet = VAN_SHEET.getSheetByName('Display shifts'); 
  
  // get array of all rows in display sheet
  var all_shifts_info = all_shifts_sheet.getRange('A1:E').getValues().filter(function (el) { return el[0] != ''; });
  var display_shifts_info = display_shifts_sheet.getRange('A2:E').getValues().filter(function (el) { return el[0] != ''; });
  
  // change string to Date object
  all_shifts_info.forEach((el) => { el[SHIFT_START] = new Date(el[SHIFT_START]); });
  display_shifts_info.forEach((el) => { el[SHIFT_START] = new Date(el[SHIFT_START]); });

  Logger.log('%s shifts found', display_shifts_info.length); 
  Logger.log('%s total shifts found', all_shifts_info.length);  

   for (var i = 0; i < display_shifts_info.length; i++) { 
  
      var row = display_shifts_info[i];
      var van_id = row[0]; 
      var shift = row[SHIFT_START];
       
      var shifts_today = 1; 
      var shifts_in_future = 0; 
      var next_shift = ""; // closest next shift
      var difference = null; // difference to minimize between current shift and next shift
      
      for (var j = 0; j < all_shifts_info.length; j++) { 
      
        var all_shift_row = all_shifts_info[j]
        
        if (all_shift_row[0] == van_id) { // if same person
        
          if(all_shift_row[SHIFT_START].getTime() != shift.getTime()) {  // excluding same shift
            let temp_difference = all_shift_row[SHIFT_START].getTime() - shift.getTime(); 
            
            if (!difference) { // if first pass for shift
              difference = temp_difference;
              next_shift = all_shift_row[SHIFT_START];
            }
            if (difference && temp_difference > 0 && temp_difference < difference) {
              difference = temp_difference; 
              next_shift = all_shift_row[SHIFT_START]; 
            }
            
            if(all_shift_row[SHIFT_START].toDateString() == shift.toDateString()) { 
              shifts_today += 1; 
            }
            else { 
              shifts_in_future += 1; 
            }
          } 
        } 
        
      }

      display_shifts_info[i].push(shifts_today); 
      display_shifts_info[i].push(next_shift); 
      display_shifts_info[i].push(shifts_in_future);
  }
  
   // add empty # of shift and next shift columns 
  display_shifts_sheet.insertColumns(6,3); 
  display_shifts_sheet.getRange('F1:H1').setValues([['# shifts today', 'next shift', '# shifts in future']]);
    
  display_shifts_sheet.getRange(2, 1, display_shifts_info.length, display_shifts_info[0].length).setValues(display_shifts_info);
  
  Logger.log('processVANInfo END'); 

}
  
