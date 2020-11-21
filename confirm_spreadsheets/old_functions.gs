/* old functions that have been phased out, including finding the spreadsheets by the folder name */


function makeSLSpreadsheets(SL_dict) { 
  
  Logger.log('makeSLSpreadsheets START'); 
  
  for (var location in SL_dict) { 
    var ss_temp = SpreadsheetApp.create(location);
    SL_dict[location] = ss_temp.getId(); 
  }
  
  Logger.log('makeSLSpreadsheets END'); 
  
  return SL_dict;  
} 


function writeSpreadsheetIDs() { 

  let SL_range = 'SL Locations!A2:A'; // gets all SL names
  var SL_array = getSLNamesArray(SL_range, INFO_SHEET); 
  var SL_dict = makeSLDict(SL_array); // empty dictionary with all SLs
  
  var spreadsheets = findSLSpreadsheets(SL_dict); // populated dictionary with SLs and their corresponding spreadsheets
  Logger.log(Object.keys(spreadsheets).length); 
  
  Logger.log(SL_array.length); 

  for (i = 0; i < SL_array.length; i++) {
  
      Logger.log('index %s', i); 
      var location = SL_array[i]; 
      Logger.log('location %s', location);
      Logger.log('spreadsheet id %s', spreadsheets[location]); 
      
     
      INFO_SHEET.getSheetByName("SL Locations").getRange("B" + String(i+2)).setValue(spreadsheets[location]); 
  }

} 



function findSLSpreadsheets(SL_dict) { 

  Logger.log('findSLSpreadsheets START'); 

  var GOTVfolder = DriveApp.getFoldersByName('NC DR + GOTV Confirm Trackers').next(); 
  var region_folders = GOTVfolder.getFolders(); // FolderIterator
  
  while (region_folders.hasNext()) { 
  
    var folder = region_folders.next(); // next folder
    //Logger.log(folder.getName());
    //if (folder != 'Canvassing') { 
      var files = folder.getFiles(); // FileIterator
      
      while (files.hasNext()) {
      
        var file = files.next(); // next file
  
        SL_dict[file.getName()] = file.getId(); 
        // Logger.log(file.getName());
      }
    //}
  }
 //Logger.log(SL_dict); 
 Logger.log('findSLSpreadsheets END'); 
 return SL_dict; 
} 


function runInsertHubs() { 

  Logger.log('runInsertHubs START'); 
 
  let SL_names_range = 'SL Locations!A3:A'; // gets all SL names
  let SL_ids_range = 'SL Locations!B3:B'; // gets all SL ids
  
  var spreadsheets = makeSLDict(SL_names_range, SL_ids_range); // dictionary with all SLs and their corresponding spreadsheet key
  
  // sheet to copy
  var hub_sheet = SpreadsheetApp.openById('1cVtlwlMWXwOSOOMhdHql7CY3fLKf-Iei6MHgi_Njxh0').getSheetByName('SL Overview'); 
        
  for (var location in spreadsheets) { 
  
   Logger.log('Starting for %s', location); 
     
    var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
    
    // delete the existing "Copy of Yesterday" sheet
    var hub_copy = spreadsheet.getSheetByName('SL Overview'); 

    if(hub_copy != null) { // if "Copy of Yesterday" sheet, exists, delete it
      spreadsheet.deleteSheet(hub_copy); 
    }
    
    hub_sheet.copyTo(spreadsheet);
    
    // copy from mock up and rename
    hub_copy = spreadsheet.getSheetByName('Copy of SL Overview'); 
    hub_copy.setName('SL Overview'); 
    
    // protect sheet
    hub_copy.protect();
    
    Logger.log('Ending for %s', location); 
  }
  
  Logger.log('runInsertHubs END'); 
}



function runUnhideColumn() { 

  let SL_names_range = 'SL Locations!A2:A'; // gets all SL names
  let SL_ids_range = 'SL Locations!B2:B'; // gets all SL ids
  
  var spreadsheets = makeSLDict(SL_names_range, SL_ids_range); // dictionary with all SLs and their corresponding spreadsheet key
  
  for (var location in spreadsheets) { 
    
    var spreadsheet = SpreadsheetApp.openById(spreadsheets[location]); 
    var sheets = getSheets(spreadsheet); 
    sheets.reshift_sheet.unhideColumn(sheets.reshift_sheet.getRange('B1'));
    
  }
  
}
