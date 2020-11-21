function populateReshifts (location, sheets, reshift_info_dict, reshift_headers, is_van) { 

  Logger.log('populateReshifts START %s', location); 
  
  // first line of headers
  sheets.reshift_sheet.getRange('H1').setValue('Dry Run 3'); 
  sheets.reshift_sheet.getRange('P1').setValue('GOTV'); 
  sheets.reshift_sheet.getRange('AG1').setValue('Other'); 
  sheets.reshift_sheet.getRange('A1:AL1').setBackground('#283351'); 
  sheets.reshift_sheet.getRange('A1:AL1').setFontColor("#ffffff").setFontSize(12).setFontWeight("bold"); 
  sheets.reshift_sheet.getRange('H1:N1').mergeAcross(); 
  sheets.reshift_sheet.getRange('P1:AE1').mergeAcross(); 
  sheets.reshift_sheet.getRange('AG1:AL1').mergeAcross(); 

  // second line of headers 
  sheets.reshift_sheet.getRange('H2').setValue('Saturday 10/24'); 
  sheets.reshift_sheet.getRange('L2').setValue('Sunday 10/25'); 
  sheets.reshift_sheet.getRange('P2').setValue('Saturday 10/31'); 
  sheets.reshift_sheet.getRange('T2').setValue('Sunday 11/1'); 
  sheets.reshift_sheet.getRange('W2').setValue('Monday 11/2'); 
  sheets.reshift_sheet.getRange('AA2').setValue('Tuesday 11/3'); 
  sheets.reshift_sheet.getRange('AG2').setValue('Weekday'); 
  sheets.reshift_sheet.getRange('A2:G2').setBackground('#283351');
  sheets.reshift_sheet.getRange('H2:AL2').setBackground('#99d8f3'); 
  sheets.reshift_sheet.getRange('A2:AL2').setFontColor("#283351").setFontSize(12).setFontWeight("bold"); 
  sheets.reshift_sheet.getRange('H2:K2').mergeAcross(); 
  sheets.reshift_sheet.getRange('L2:N2').mergeAcross(); 
  sheets.reshift_sheet.getRange('P2:S2').mergeAcross(); 
  sheets.reshift_sheet.getRange('T2:V2').mergeAcross();
  sheets.reshift_sheet.getRange('W2:Z2').mergeAcross();
  sheets.reshift_sheet.getRange('AA2:AE2').mergeAcross();
  sheets.reshift_sheet.getRange('AG2:AL2').mergeAcross();
   
  // third line of headers
  sheets.reshift_sheet.getRange(3, 1, reshift_headers.length, reshift_headers[0].length).setValues(reshift_headers); 
  sheets.reshift_sheet.getRange('A3:G3').setBackground('#283351');
  sheets.reshift_sheet.getRange('A3:G3').setFontColor("#ffffff").setFontSize(12).setFontWeight("bold"); 
  sheets.reshift_sheet.getRange('H3:AL3').setBackground('#b7b7b7');
  sheets.reshift_sheet.getRange('H3:AL3').setFontColor('#000000').setFontWeight('bold').setFontSize(12).setFontWeight("bold");
  
  // center align the first 3 rows of headers
  sheets.reshift_sheet.getRange('A1:AL3').setHorizontalAlignment("center");
  
  if(reshift_info_dict != null) { 
    // write VAN links to sheets
    let links = reshift_info_dict.map(function(value,index) {return value[0];}); // 1-D array of VAN links
    let ids = reshift_info_dict.map(function(value,index) {return value[1];}); // 1-D array of VAN IDs
    
    if(links.length == ids.length) { 
      if(is_van) { 
        var values = []; 
        links.forEach((link, index) => { values.push([SpreadsheetApp.newRichTextValue().setText(ids[index]).build()]); }); // build hyperlinks to go into Sheets
        sheets.reshift_sheet.getRange(4, 1, values.length, values[0].length).setRichTextValues(values); 
      } 
      else { 
        var values = []; 
        links.forEach((link, index) => { values.push([SpreadsheetApp.newRichTextValue().setText(ids[index]).setLinkUrl(link).build()]); }); // build hyperlinks to go into Sheets
        sheets.reshift_sheet.getRange(4, 1, values.length, values[0].length).setRichTextValues(values); 
      }
    }
    else { 
      Logger.log('Something wrong with the number of rows in this location %s', location); 
      return; 
    }
  
    // write the rest of the data into sheets
    var new_info_dict = reshift_info_dict.map(function(value, index) { return value.slice(2); }); // all the information except in the first 2 columns
    sheets.reshift_sheet.getRange(4, 2, new_info_dict.length, new_info_dict[0].length).setValues(new_info_dict);
  }
  
  // autoresize columns
  sheets.reshift_sheet.autoResizeColumns(1, 6);
  sheets.reshift_sheet.setColumnWidth(7, 200); // double width of Notes column
 
  // data validation rules for column F (reshifted?)
  const reshift_options = ['Yes', 'No']; 
  const reshift_helpText = 'Please choose one of the options from the drop down menu: Yes or No';
  const reshift_validation = SpreadsheetApp.newDataValidation().requireValueInList(reshift_options, true).setAllowInvalid(false).setHelpText(reshift_helpText).build();
  const reshift_range = sheets.reshift_sheet.getRange('F4:F'); 
  reshift_range.setDataValidation(reshift_validation);
  
  const scheduled_options = ['Scheduled']; 
  const scheduled_validation = SpreadsheetApp.newDataValidation().requireValueInList(scheduled_options, true).setAllowInvalid(false).build();
  const scheduled_range_1 = sheets.reshift_sheet.getRange('H4:AE'); 
  const scheduled_range_2 = sheets.reshift_sheet.getRange('AH4:AK'); 
  scheduled_range_1.setDataValidation(scheduled_validation);
  scheduled_range_2.setDataValidation(scheduled_validation); 
  
  // set date and time formats for Other section
  sheets.reshift_sheet.getRange('AG4:AG').setNumberFormat('mmm dd');
  sheets.reshift_sheet.getRange('AL4:AL').setNumberFormat('h:mm am/pm');
  
  // make the cell turn red or green if reshifted 
  let rules = sheets.reshift_sheet.getConditionalFormatRules();
  const reshift_colors = ['#93c47d', '#e06666'];
  reshift_colors.forEach((color, index) => { rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(reshift_options[index]).setBackground(color).setRanges([reshift_range]).build()); }); 
  
  // make the cell turn green if scheduled
  const scheduled_color = ['#93c47d'];
  scheduled_color.forEach((color, index) => { rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(scheduled_options[index]).setBackground(color).setRanges([scheduled_range_1]).build()); });
  scheduled_color.forEach((color, index) => { rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(scheduled_options[index]).setBackground(color).setRanges([scheduled_range_2]).build()); });

  // alternate row colors
  let total_range = sheets.reshift_sheet.getRange('A4:AL'); 
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=ISEVEN(ROW())")
    .setBackground("#f3f3f3")
    .setRanges([total_range])
    .build();
  rules.push(rule);
  sheets.reshift_sheet.setConditionalFormatRules(rules);
  
  // remove background colors, set to 20 pixels for width, and remove data validations for Column O, W, AN
  sheets.reshift_sheet.getRange('O1:O').setBackground(null); 
  sheets.reshift_sheet.setColumnWidth(15, 20); 
  sheets.reshift_sheet.getRange('O1:O').setDataValidation(null); 
  sheets.reshift_sheet.getRange('AF1:AF').setBackground(null); 
  sheets.reshift_sheet.setColumnWidth(32, 20); 
  sheets.reshift_sheet.getRange('AF1:AF').setDataValidation(null); 
  
  // left align columns A through K
  sheets.reshift_sheet.getRange('A4:AL').setHorizontalAlignment("left");
  
  // lock header rows
  sheets.reshift_sheet.setFrozenRows(3); 
  // lock columns A:C 
  sheets.reshift_sheet.setFrozenColumns(2); 
  
  // don't allow edits on columns A through F except for me
  var protection = sheets.reshift_sheet.getRange('A2:E').protect().setDescription('Protect volunteer information cells');
  var me = Session.getEffectiveUser(); 
  protection.addEditor(me);
  protection.addEditor('brent.efron@2020victory.com'); 
  
  protection.removeEditors(protection.getEditors());
  if (protection.canDomainEdit()) {
    protection.setDomainEdit(false); 
  }

  // remove extraneous rows
  var columns = sheets.reshift_sheet.getMaxColumns();
  if (columns > 38) { 
    sheets.reshift_sheet.deleteColumns(38, columns - 37); 
  }
    
  Logger.log('populateReshifts END %s', location);
}



function populateWalkIns (location, sheets, walk_in_headers, is_canvass) { 

  Logger.log('populateWalkIns START %s', location); 
  
  // first line of headers
  sheets.walk_in_sheet.getRange('I1').setValue('Dry Run 3'); 
  sheets.walk_in_sheet.getRange('Q1').setValue('GOTV'); 
  sheets.walk_in_sheet.getRange('AH1').setValue('Other'); 
  sheets.walk_in_sheet.getRange('A1:AM1').setBackground('#283351'); 
  sheets.walk_in_sheet.getRange('A1:AM1').setFontColor("#ffffff").setFontSize(12).setFontWeight("bold"); 
  sheets.walk_in_sheet.getRange('I1:O1').mergeAcross(); 
  sheets.walk_in_sheet.getRange('Q1:AF1').mergeAcross(); 
  sheets.walk_in_sheet.getRange('AH1:AM1').mergeAcross(); 

  // second line of headers 
  sheets.walk_in_sheet.getRange('I2').setValue('Saturday 10/24'); 
  sheets.walk_in_sheet.getRange('M2').setValue('Sunday 10/25'); 
  sheets.walk_in_sheet.getRange('Q2').setValue('Saturday 10/31'); 
  sheets.walk_in_sheet.getRange('U2').setValue('Sunday 11/1'); 
  sheets.walk_in_sheet.getRange('X2').setValue('Monday 11/2'); 
  sheets.walk_in_sheet.getRange('AB2').setValue('Tuesday 11/3'); 
  sheets.walk_in_sheet.getRange('AH2').setValue('Weekday'); 
  sheets.walk_in_sheet.getRange('A2:H2').setBackground('#283351');
  sheets.walk_in_sheet.getRange('I2:AM2').setBackground('#99d8f3'); 
  sheets.walk_in_sheet.getRange('A2:AM2').setFontColor("#283351").setFontSize(12).setFontWeight("bold"); 
  sheets.walk_in_sheet.getRange('I2:L2').mergeAcross(); 
  sheets.walk_in_sheet.getRange('M2:O2').mergeAcross(); 
  sheets.walk_in_sheet.getRange('Q2:T2').mergeAcross(); 
  sheets.walk_in_sheet.getRange('U2:W2').mergeAcross();
  sheets.walk_in_sheet.getRange('X2:AA2').mergeAcross();
  sheets.walk_in_sheet.getRange('AB2:AF2').mergeAcross();
  sheets.walk_in_sheet.getRange('AH2:AM2').mergeAcross();
   
  // third line of headers
  sheets.walk_in_sheet.getRange(3, 1, walk_in_headers.length, walk_in_headers[0].length).setValues(walk_in_headers); 
  sheets.walk_in_sheet.getRange('A3:H3').setBackground('#283351');
  sheets.walk_in_sheet.getRange('A3:H3').setFontColor("#ffffff").setFontSize(12).setFontWeight("bold"); 
  sheets.walk_in_sheet.getRange('I3:AM3').setBackground('#b7b7b7');
  sheets.walk_in_sheet.getRange('I3:AM3').setFontColor('#000000').setFontWeight('bold').setFontSize(12).setFontWeight("bold");
  
  // center align the first 3 rows of headers
  sheets.walk_in_sheet.getRange('A1:AM3').setHorizontalAlignment("center");
  
  // set first 7 column widths
  sheets.walk_in_sheet.setColumnWidths(1, 7, 150);
  sheets.walk_in_sheet.setColumnWidth(8, 200); // set Notes column twice as wide
  
  // set date and time formats
  sheets.walk_in_sheet.getRange('D2:D').setNumberFormat('mmm dd');
  sheets.walk_in_sheet.getRange('E2:E').setNumberFormat('h:mm am/pm');
  
  // data validation rules for column F and G
  const reshift_options = ['Yes', 'No']; 
  const reshift_helpText = 'Please choose one of the options from the drop down menu: Yes or No';
  const reshift_validation = SpreadsheetApp.newDataValidation().requireValueInList(reshift_options, true).setAllowInvalid(false).setHelpText(reshift_helpText).build();
  const reshift_range = sheets.walk_in_sheet.getRange('F4:G'); 
  reshift_range.setDataValidation(reshift_validation);
  
  // data validation rules for shifts in future (Scheduled?)
  const scheduled_options = ['Scheduled']; 
  const scheduled_validation = SpreadsheetApp.newDataValidation().requireValueInList(scheduled_options, true).setAllowInvalid(true).build();
  const scheduled_range_1 = sheets.walk_in_sheet.getRange('I4:AF'); 
  const scheduled_range_2 = sheets.walk_in_sheet.getRange('AI4:AL'); 
  scheduled_range_1.setDataValidation(scheduled_validation);
  scheduled_range_2.setDataValidation(scheduled_validation);
   
  // remove background colors, set to 20 pixels for width, and remove data validations for Column O, W, AN
  sheets.walk_in_sheet.getRange('P1:P').setBackground(null); 
  sheets.walk_in_sheet.setColumnWidth(16, 20); 
  sheets.walk_in_sheet.getRange('P1:P').setDataValidation(null); 
  sheets.walk_in_sheet.getRange('AG1:AG').setBackground(null); 
  sheets.walk_in_sheet.setColumnWidth(33, 20); 
  sheets.walk_in_sheet.getRange('AG1:AG').setDataValidation(null); 
  
  // set date and time formats for Other column
  sheets.walk_in_sheet.getRange('AH4:AH').setNumberFormat('mmm dd');
  sheets.walk_in_sheet.getRange('AM4:AM').setNumberFormat('h:mm am/pm');

  let rules = sheets.walk_in_sheet.getConditionalFormatRules();
  
  // make the cell turn red or green if reshifted 
  const reshift_colors = ['#93c47d', '#e06666'];
  reshift_colors.forEach((color, index) => { rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(reshift_options[index]).setBackground(color).setRanges([reshift_range]).build()); }); 
  
  // make the cell turn green if scheduled
  const scheduled_color = ['#93c47d'];
  scheduled_color.forEach((color, index) => { rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(scheduled_options[index]).setBackground(color).setRanges([scheduled_range_1]).build()); }); 
  scheduled_color.forEach((color, index) => { rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(scheduled_options[index]).setBackground(color).setRanges([scheduled_range_2]).build()); }); 
  
    // alternate row colors
  let total_range = sheets.walk_in_sheet.getRange('A4:AU'); 
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=ISEVEN(ROW())")
    .setBackground("#f3f3f3")
    .setRanges([total_range])
    .build();
  rules.push(rule);
  sheets.walk_in_sheet.setConditionalFormatRules(rules);
 
  // lock header rows 
  sheets.walk_in_sheet.setFrozenRows(3); 
  // lock columns A
  sheets.walk_in_sheet.setFrozenColumns(1); 
  
  // remove extraneous rows
  var columns = sheets.walk_in_sheet.getMaxColumns();
  if (columns >= 40) { 
   sheets.walk_in_sheet.deleteColumns(40, columns - 39); 
  }
  
  // if VSL, hide column F
  if(is_canvass == true) { 
    sheets.walk_in_sheet.unhideColumn(sheets.walk_in_sheet.getRange("F1")); 
  }
  if(is_canvass == false) { 
    sheets.walk_in_sheet.hideColumn(sheets.walk_in_sheet.getRange("F1")); 
  }
  
  Logger.log('populateWalkIns END %s', location);
}



function populateConfirms (location, sheets, confirm_info_dict, confirm_headers, dates, is_van, is_canvass) { 

  Logger.log('populateConfirms START %s', location); 
  
  // headers formatting
  sheets.confirm_sheet.getRange(1, 1, confirm_headers.length, confirm_headers[0].length).setValues(confirm_headers).setBackground("#283351").setFontSize(12).setFontColor("#ffffff").setFontWeight('bold').setHorizontalAlignment('center'); 
  
  if(confirm_info_dict != null) { 
    // write VAN links to sheets
    let links = confirm_info_dict.map(function(value,index) {return value[0];}); // 1-D array of VAN links
    let ids = confirm_info_dict.map(function(value,index) {return value[1];}); // 1-D array of VAN IDs
    
    if(links.length == ids.length) { 
      if(is_van) { 
        var values = []; 
        links.forEach((link, index) => { values.push([SpreadsheetApp.newRichTextValue().setText(ids[index]).build()]); }); // build hyperlinks to go into Sheets
        sheets.confirm_sheet.getRange(2, 1, values.length, values[0].length).setRichTextValues(values); 
      } 
      else { 
        var values = []; 
        links.forEach((link, index) => { values.push([SpreadsheetApp.newRichTextValue().setText(ids[index]).setLinkUrl(link).build()]); }); // build hyperlinks to go into Sheets
        sheets.confirm_sheet.getRange(2, 1, values.length, values[0].length).setRichTextValues(values); 
      }
    }
    else { 
      Logger.log('Something wrong with the number of rows in this location %s', location); 
      return; 
    }
  
    // write the rest of the data into sheets
    var new_info_dict = confirm_info_dict.map(function(value, index) { return value.slice(2); }); // all the information except in the first 2 columns
    sheets.confirm_sheet.getRange(2, 2, new_info_dict.length, new_info_dict[0].length).setValues(new_info_dict);
  }
  
  // autoresize columns
  sheets.confirm_sheet.autoResizeColumns(1, 14); 
  sheets.confirm_sheet.setColumnWidth(12, 100); 
  sheets.confirm_sheet.setColumnWidth(15, 200); 
  sheets.confirm_sheet.setColumnWidths(16, 3, 100); // set pass colums to 100 pixels wide each
  
  // format dates and number of shifts (columns E:H)  sheets.walk_in_sheet
  sheets.confirm_sheet.getRange('H2:H').setNumberFormat('mmm dd h:mm am/pm');
  sheets.confirm_sheet.getRange('J2:J').setNumberFormat('mmm dd h:mm am/pm');
  sheets.confirm_sheet.getRange('M2:M').setNumberFormat('mmm dd h:mm am/pm');
  sheets.confirm_sheet.getRange('I2:I').setNumberFormat('0');
  sheets.confirm_sheet.getRange('K2:K').setNumberFormat('0');
  
  // make column L (status) drop down menu w/ data validation
  const status_options = ['Scheduled', 'Left Msg', 'Confirmed', 'Conf Twice', 'Completed', 'No Show', 'Declined']; 
  const status_helpText = 'Please choose one of the options from the drop down menu: Scheduled, Confirmed, Left Msg, Tentative, Conf Twice, Completed, No Show, or Declined';
  const status_validation = SpreadsheetApp.newDataValidation().requireValueInList(status_options, true).setAllowInvalid(false).setHelpText(status_helpText).build();
  const status_range = sheets.confirm_sheet.getRange('L2:L'); 
  status_range.setDataValidation(status_validation);
  
  // conditional formatting color rules for column H (green if Saturday, yellow if Sunday)
  const shift_range = sheets.confirm_sheet.getRange('H2:H'); 
  const shift_colors = ['#d9ead3', '#fff2cc']; 
  // const shift_colors = ['#93c47d', '#b6d7a8', '#d9ead3','#f3f3f3', '#f6b26b', '#f9cb9c', '#fce5cd', '#fff2cc']; 
  let rules = sheets.confirm_sheet.getConditionalFormatRules();
  shift_colors.forEach((color, index) => { rules.push(SpreadsheetApp.newConditionalFormatRule().whenDateEqualTo(dates[index]).setBackground(color).setRanges([shift_range]).build()); }); 
  
  // conditional formatting color rules for column L (status) 
  const status_colors = ['#ffe599', '#F6B26B', '#d9ead3', '#d9ead3', '#6aa84f', '#ea9999', '#ea9999']; 
  status_options.forEach((option, index) => { rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(option).setBackground(status_colors[index]).setRanges([status_range]).build()); }); 
  
  const training_canvassing_range = sheets.confirm_sheet.getRange('D2:D'); 
  const training_phonebanking_range = sheets.confirm_sheet.getRange('N2:N'); 
  const training_options = ['No', 'Yes', 'N/A'];
  const training_colors = ['#e06666', '#93c47d', null];
  training_colors.forEach((color, index) => { rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(training_options[index]).setBackground(color).setRanges([training_canvassing_range]).build()); }); 
  training_colors.forEach((color, index) => { rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(training_options[index]).setBackground(color).setRanges([training_phonebanking_range]).build()); }); 
  
  
   // alternate row colors
  let total_range = sheets.confirm_sheet.getRange('A2:Z'); 
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=ISEVEN(ROW())")
    .setBackground("#f3f3f3")
    .setRanges([total_range])
    .build();
  rules.push(rule);
  sheets.confirm_sheet.setConditionalFormatRules(rules);
  
  
  // write pass options
  const pass_options = ['Call', 'Text'];
  const pass_helpText = 'Choose the method of voter contact (call or text)'; 
  const pass_validation = SpreadsheetApp.newDataValidation().requireValueInList(pass_options, true).setAllowInvalid(false).setHelpText(pass_helpText).build();
  const pass_range = sheets.confirm_sheet.getRange('P2:R');
  pass_range.setDataValidation(pass_validation);
  
  // left align columns A through K
  sheets.confirm_sheet.getRange('A2:L').setHorizontalAlignment("left");
  
  // hide column B
  sheets.confirm_sheet.hideColumn(sheets.confirm_sheet.getRange('B1'));
  
  // hide column D (trained for canvassing) if VSL
  if(is_canvass == false) { sheets.confirm_sheet.hideColumn(sheets.confirm_sheet.getRange('D1')); }
  
  // hide column N (trained for phonebanking if SL
   if(is_canvass == true) { sheets.confirm_sheet.hideColumn(sheets.confirm_sheet.getRange('N1')); }
  
  // lock header row 
  sheets.confirm_sheet.setFrozenRows(1); 
  // lock columns A:D
  sheets.confirm_sheet.setFrozenColumns(4); 
  
  // don't allow edits on columns A through J except for me
  var protection = sheets.confirm_sheet.getRange('A2:K').protect().setDescription('Protect volunteer information cells');
  var me = Session.getEffectiveUser(); 
  protection.addEditor(me);
  
  protection.removeEditors(protection.getEditors());
  if (protection.canDomainEdit()) {
    protection.setDomainEdit(false); 
  }

  // remove extraneous rows
  var columns = sheets.confirm_sheet.getMaxColumns();
  if (columns >= 19) { 
    sheets.confirm_sheet.deleteColumns(19, columns - 18); 
  }
    
  Logger.log('populateConfirms END %s', location);
}


function transferSheetToYesterday(location, spreadsheet, sheets) { 

  Logger.log('transferSheetToYesterday START %s', location); 
  
  // delete the existing "Copy of Yesterday" sheet
  var yesterday_confirm_sheet = spreadsheet.getSheetByName('Copy of Confirm List Today 1'); 
  var yesterday_confirm_sheet_2 = spreadsheet.getSheetByName('Yesterday Confirms'); 

  if(yesterday_confirm_sheet != null) { // if "Copy of Yesterday" sheet, exists, delete it
    spreadsheet.deleteSheet(yesterday_confirm_sheet); 
  }
  
  if(yesterday_confirm_sheet_2 != null) { 
    spreadsheet.deleteSheet(yesterday_confirm_sheet_2); 
  } 
  
  // copy the current state of the confirm sheet
  sheets.confirm_sheet.copyTo(spreadsheet);
  
  // get the name of the copied spreadsheet, and set to "Copy of Yesterday"
  var orig_confirm_name = sheets.confirm_sheet.getName(); 
  var new_confirm_name = 'Copy of ' + orig_confirm_name; 
  
  var new_confirm_sheet = spreadsheet.getSheetByName(new_confirm_name)
  new_confirm_sheet.setName('Yesterday Confirms'); 
  new_confirm_sheet.protect();  // protect entire sheet
  
  // delete the existing "Copy of Yesterday" sheet
  var yesterday_walk_in_sheet = spreadsheet.getSheetByName('Copy of Reshifts'); 
  var yesterday_walk_in_sheet_2 = spreadsheet.getSheetByName('Yesterday Reshifts'); 

  if(yesterday_walk_in_sheet != null) { // if "Copy of Yesterday" sheet, exists, delete it
    spreadsheet.deleteSheet(yesterday_reshift_sheet); 
  }
  if(yesterday_reshift_sheet_2 != null) { // if "Copy of Yesterday" sheet, exists, delete it
    spreadsheet.deleteSheet(yesterday_reshift_sheet_2); 
  }
  
  // copy the current state of the reshift sheet
  sheets.reshift_sheet.copyTo(spreadsheet);
  
  // get the name of the copied spreadsheet, and set to "Copy of Yesterday"
  var orig_reshift_name = sheets.reshift_sheet.getName(); 
  var new_reshift_name = 'Copy of ' + orig_reshift_name; 
  
  var new_reshift_sheet = spreadsheet.getSheetByName(new_reshift_name)
  new_reshift_sheet.setName('Yesterday Reshifts'); 
  new_reshift_sheet.protect();  // protect entire sheet
  
  
  Logger.log('transferSheetToYesterday END %s', location); 

} 


function getSheets(spreadsheet) { 
  // gets the sheet objects so that we can edit them
  // if they don't exist, create a sheet with that name
  
  var confirm_sheet = spreadsheet.getSheetByName('Confirm List Today');
  var reshift_sheet = spreadsheet.getSheetByName('Reshifts'); 
  var walk_in_sheet = spreadsheet.getSheetByName('Walk ins'); 
  
  if (!confirm_sheet) { 
    spreadsheet.insertSheet('Confirm List Today');
    confirm_sheet = spreadsheet.getSheetByName('Confirm List Today');
  }
  if (!walk_in_sheet) { 
    spreadsheet.insertSheet('Walk ins'); 
    walk_in_sheet = spreadsheet.getSheetByName('Walk ins'); 
  }
  if (!reshift_sheet) { 
    spreadsheet.insertSheet('Reshifts'); 
    reshift_sheet = spreadsheet.getSheetByName('Reshifts'); 
  }
  
  return {confirm_sheet, walk_in_sheet, reshift_sheet}; 
} 
