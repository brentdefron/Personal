function clearConfirm(location, sheets) { 
  Logger.log('clearConfirm START %s', location);
  
  var confirm_columns = sheets.confirm_sheet.getMaxColumns(); 
  
  // clear formatting, contents, and data validations
  sheets.confirm_sheet.clear(); 
  
  // reset all column widths to 100 pixels
  sheets.confirm_sheet.setColumnWidths(1, confirm_columns, 100); 
  
  // clear data validations
  sheets.confirm_sheet.getRange('A2:Z').clearDataValidations(); 
  
  // remove protections
  var confirm_protections = sheets.confirm_sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  for (var i = 0; i < confirm_protections.length; i++) {
    var protection = confirm_protections[i];
    if (protection.canEdit()) {
      protection.remove();
    }
  }
  
  Logger.log('clearConfirm END %s', location); 
  
} 

function clearReshift(location, sheets) { 

  Logger.log('clearReshift START %s', location);

  var reshift_columns = sheets.reshift_sheet.getMaxColumns();
  
  // clear formatting, contents, and data validations
  sheets.reshift_sheet.clear(); 
  
  // reset all column widths to 100 pixels
  sheets.reshift_sheet.setColumnWidths(1, reshift_columns, 100); 
 
  // clear data validations
  sheets.reshift_sheet.getRange('A2:AU').clearDataValidations(); 
  
  // remove protections
  var reshift_protections = sheets.reshift_sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  for (var i = 0; i < reshift_protections.length; i++) {
    var protection = reshift_protections[i];
    if (protection.canEdit()) {
      protection.remove();
    }
  }   
  
  Logger.log('clearReshift END %s', location); 
  
} 


function clearWalkIn(location, sheets) { 
  Logger.log('clearWalkIn START %s', location); 
   
  var walk_in_columns = sheets.walk_in_sheet.getMaxColumns();
    
  // clear formatting, contents, and data validations
  sheets.walk_in_sheet.clear(); 
  
  // reset all column widths to 100 pixels
  sheets.walk_in_sheet.setColumnWidths(1, walk_in_columns, 100);
  
  // clear data validations
  sheets.walk_in_sheet.getRange('A2:AZ').clearDataValidations(); 
  
  // remove protections
  var walk_in_protections = sheets.walk_in_sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  for (var i = 0; i < walk_in_protections.length; i++) {
    var protection = walk_in_protections[i];
    if (protection.canEdit()) {
      protection.remove();
    }
  }
  
 Logger.log('clearWalkIn END %s', location); 
  
} 
