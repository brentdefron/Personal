/*
BFP Archived code
Table name: N/A 
Pipeline/process this was a part of: Daily emails
Author (or who future us should bother with questions): Sabrina Chern
code tldr; This code gets the relevant information to put into the emails that are sent out. 
*/

// get all information that we create tables for-- dialer, texting, VPBs, shifts scheduled, active volunteers, dropped shifts
// folds all the individual functions into one larger function
function getAllData(org_array, orgs_info, all_range) {

  Logger.log('getAllData START'); 
  
  var dialer_dict = getDialerData(org_array, orgs_info, all_range.dialer_range); 
  var text_dict = getTextData(org_array, orgs_info, all_range.text_range);
  var vpb_dict = getVPBData(org_array, orgs_info, all_range.vpb_range); 
  var shift_dict = getShiftsSchedData(org_array, orgs_info, all_range.shift_range); 
  var actives_dict = getActivesData(org_array, orgs_info, all_range.actives_range); 
  var dropped_dict = getDroppedData(org_array, orgs_info, all_range.dropped_range); 
  
  Logger.log('getAllData END'); 
  
  return {dialer_dict, text_dict, vpb_dict, shift_dict, actives_dict, dropped_dict}; 

}



function getPodsInfo(pods_array, pods_info_range) { 
  /* 
  Parameters: orgs_dict is an array of organizer codes
  Returns: updated orgs_dict, dictionary of organizers: {code: [Full Name, email, ROD email, # of dials]... } 
  */ 

  Logger.log("getPodInfo START"); 
  
  var pods_info_dict = {}; 
  pods_array.forEach((pod) => {pods_info_dict[pod] = []}); // create dictionary
  
  var info = SHEET.getRange(pods_info_range).getValues(); // get organizer name, email, ROD email, dial attempts
  
  var info_filtered = info.filter(function (el) {return el[0] != "";}); // filter all the data so no empty elements
  
  for(var i = 0; i < info_filtered.length; i++) {
  
    row = info_filtered[i]; 
    
    try {
       pods_info_dict[row[PODINFO_KEY]].push(row); 
    }
    catch(err) {
      Logger.log("ERROR at data[%s], row %s, org %s", i, row, row[PODINFO_REGION]);
      Logger.log("%s: %s", err.name, err.message);
      throw(err);
    }
  }
 
  Logger.log(pods_info_dict); 
  Logger.log("getPodsInfo END");

  return pods_info_dict;

}

function getOrgInfo(org_array, org_info_range) { 
  /* 
  Parameters: orgs_dict is an array of organizer codes
  Returns: updated orgs_dict, dictionary of organizers: {code: [Full Name, email, ROD email, # of dials]... } 
  */ 

  Logger.log("getOrgInfo START"); 
  
  var orgs_info_dict = {}; 
  org_array.forEach((org) => {orgs_info_dict[org.toUpperCase()] = []}); // create dictionary
  
  var info = SHEET.getRange(org_info_range).getValues(); // get organizer name, email, ROD email, dial attempts
  
  var info_filtered = info.filter(function (el) {return el[0] != "";}); // filter all the data so no empty elements
  
  for(var i = 0; i < info_filtered.length; i++) {
  
    row = info_filtered[i]; // step through each organizer
    
    let org_code = row[0].toUpperCase(); 
    let org_name = row[1];
    let org_email = row[2].toLowerCase(); // get org by email, email is the second column of info_filtered
    let rod_email = row[3].toLowerCase(); 
    let dials = row[4]; 
    let actives = row[5]; 
    let actives_not_scheduled = row[6]; 
    let open_shifts = row[7]; 
    let vols_confirmed = row[8]; 
    let vols_tested = row[9]; 
    
    if (!org_email || org_email =='') {
      Logger.log('No organizer listed for this turf'); 
      continue;
    } 
    
    if (org_email && (!rod_email || rod_email == '')) { // if organizer does not have ROD in the database
      try {
       orgs_info_dict[org_code].push(org_name); // push full name
       orgs_info_dict[org_code].push(org_email); 
       orgs_info_dict[org_code].push(''); // push empty ROD email
       orgs_info_dict[org_code].push(dials); 
       orgs_info_dict[org_code].push(actives);
       orgs_info_dict[org_code].push(actives_not_scheduled);
       orgs_info_dict[org_code].push(open_shifts);
       orgs_info_dict[org_code].push(vols_confirmed); 
       orgs_info_dict[org_code].push(vols_tested); 
      }
      
      catch(err) {
      Logger.log("ERROR at row %s, org %s", row, org);
      //Logger.log("%s: %s", err.name, err.message);
      throw(err);
      }
      
     continue;
    }
    
    // if organizer has ROD in database
    try {
       orgs_info_dict[org_code].push(org_name); 
       orgs_info_dict[org_code].push(org_email); 
       orgs_info_dict[org_code].push(rod_email); 
       orgs_info_dict[org_code].push(dials); 
       orgs_info_dict[org_code].push(actives);
       orgs_info_dict[org_code].push(actives_not_scheduled);
       orgs_info_dict[org_code].push(open_shifts);
       orgs_info_dict[org_code].push(vols_confirmed); 
       orgs_info_dict[org_code].push(vols_tested); 
    }
    catch(err) {
      Logger.log("ERROR at data[%s], row %s, org %s", i, row, org_email);
      //Logger.log("%s: %s", err.name, err.message);
      throw(err);
    }
  }
 
  Logger.log(orgs_info_dict); 
  Logger.log("getOrgInfo END");

  return orgs_info_dict;

}


function getOrgsArray(org_codes_range) {
  // gets an array of organizers by turf from the Organizer Export tab
  // used as a basis to create all dictionaries that are keyed by organizer code
  
  Logger.log('getOrgsArray START');
  
  var values = SHEET.getRangeByName(org_codes_range).getValues();
  
  if(!values) {
    Logger.log('Something went wrong, null organizers');
  }
  org_array = values.flat().filter(x => x!=''); // array of organizer codes
  Logger.log('%s organizers found', org_array.length);
  
  Logger.log('getOrgsArray END'); 
 
  return org_array;
}


// get data for active volunteers that have not been scheduled for another shift
function getActivesData(org_array, orgs_info, actives_range) {
  
  Logger.log("getActivesData START");
  
  var actives_dict = {}; 
  org_array.forEach((org) => {actives_dict[org.toUpperCase()] = []}); // create dictionary with organizer codes initialized with an empty array
 
  var actives_data = SHEET.getRange(actives_range).getValues(); // get dialer data (will be 2D array)
  var actives_filtered = actives_data.filter(function (el) {return el[0] != "";}); // and filter it so no empty rows
 
  for(var i = 0; i < actives_filtered.length; i++) { // iterate over each row in that 2D array
  
    row = actives_filtered[i]; // isolating that row so easier to work with visually
    
    if (typeof row[4] == 'object') { 
       row[4] = row[4].toDateString();  // chop off time on date
    } 
    
    var has_next_shift = row[6]; 
    
    var org_code = row[FO_CODE_INDEX].toUpperCase(); // gets the organizer code from the text output sheet
    
    if (org_code == 'NO TURF ASSIGNED' || org_code == 'NO TURF' || org_code == 'NO REGION' || org_code == 'OOS') { // skip if no turf
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('Volunteer not turfed'); 
      continue; 
    } 
    
    let org_email = orgs_info[org_code][ORGINFO_EMAIL]; // gets the organizer email from org_info dictionary
    
    
    if (!org_email || org_email == '') { // skip if no organizer email
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('No FO listed for this volunteer'); 
      continue; 
    } 
    
    if(!has_next_shift || has_next_shift == '') { // if active volunteer didn't have another shift, then add that row to the organizer's array
      try {
        actives_dict[org_code].push(row);
      }
      catch(err) {
        Logger.log("ERROR at data[%s], row %s, org %s", i, row, org_code);
        Logger.log("%s: %s", err.name, err.message);
        throw(err);
      }
    }
  }
  
  // Logger.log(text_dict); 
  Logger.log("getActivesData END");

  return actives_dict;
}

function getDroppedData(org_array, orgs_info, dropped_range) {

  Logger.log("getDroppedData START");
  
  var dropped_dict = {}; 
  
  org_array.forEach((org) => {dropped_dict[org.toUpperCase()] = []}); // create dictionary
  
  var dropped_data = SHEET.getRange(dropped_range).getValues(); // get Shifts data
  var dropped_filtered = dropped_data.filter(function (el) {return el[0] != "";}); // and filter it so no empty rows
  
  for(var i = 0; i < dropped_filtered.length; i++) {
  
    row = dropped_filtered[i];
    
    if (typeof row[DROPPED_INDEX_STOP] == 'object') { 
       row[DROPPED_INDEX_STOP] = row[DROPPED_INDEX_STOP].toDateString(); //.substring(0,15); // chop off time on date
    } 
    
    var org_code = row[DROPPED_FO_CODE_INDEX].toUpperCase(); // gets the organizer code from the shiftsched output sheet
    
    if (!org_code || org_code == 'NO TURF ASSIGNED' || org_code == 'NO TURF' || org_code == 'NO REGION' || org_code == 'OOS') { // skip if no organizer turf connected to this shift
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('Volunteer not turfed'); 
      continue; 
    }
     
    if (orgs_info[org_code] == undefined) { // skip if no organizer code
      continue; 
    }
    
    let org_email = orgs_info[org_code][ORGINFO_EMAIL]; // gets the organizer email from org_info dictionary
    
    if (!org_email || org_email == '') {  // skip if no email
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('No FO listed for this volunteer'); 
      continue; 
    } 
    
    var event_name = row[4]; 
    var shift_readded = row[8];
    
    if (!shift_readded && event_name.toUpperCase().includes('VOTER PROTECTION') == false) { // skip any shifts that are votepro
      try {
        dropped_dict[org_code].push(row); // add shift to organizer's array
      }
      catch(err) {
        Logger.log("ERROR at data[%s], row %s, org %s", i, row, org_code);
        Logger.log("%s: %s", err.name, err.message);
        throw(err);
      }
    }
  }

  Logger.log("getDroppedData END");
  return dropped_dict;
}


function getShiftsSchedData(org_array, orgs_info, shiftsched_range) {

  Logger.log("getShiftsSchedData START");
  
  var shiftsched_dict = {}; 
  
  org_array.forEach((org) => {shiftsched_dict[org.toUpperCase()] = []}); // create dictionary
  
  var shiftsched_data = SHEET.getRange(shiftsched_range).getValues(); // get Shifts data
  var shiftsched_filtered = shiftsched_data.filter(function (el) {return el[0] != "";}); // and filter it so no empty rows
  
  for(var i = 0; i < shiftsched_filtered.length; i++) {
  
    row = shiftsched_filtered[i];
    
    Logger.log('type of variable'); 
    
    if (typeof row[5] == 'object') { 
       row[5] = row[5].toDateString(); //.substring(0,15); // chop off time on date
    } 
    
    
    var org_code = row[SHIFTS_FO_CODE_INDEX].toUpperCase(); // gets the organizer code from the shiftsched output sheet
    
    if (org_code == 'NO TURF ASSIGNED' || org_code == 'NO TURF' || org_code == 'NO REGION' || org_code == 'OOS') {
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('Volunteer not turfed'); 
      continue; 
    }
    
    Logger.log('look here' + org_code); 
    let org_email = orgs_info[org_code][ORGINFO_EMAIL]; // gets the organizer email from org_info dictionary
    
    if (!org_email || org_email == '') {
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('No FO listed for this volunteer'); 
      continue; 
    } 
    
    try {
      shiftsched_dict[org_code].push(row);
    }
    catch(err) {
      Logger.log("ERROR at data[%s], row %s, org %s", i, row, org_code);
      Logger.log("%s: %s", err.name, err.message);
      throw(err);
    }
  }

  Logger.log("getShiftSchedData END");
  return shiftsched_dict;
}


function getVPBData(org_array, orgs_info, vpb_range) {
  
  Logger.log("getVPBData START");
  
  var VPB_dict = {}; 
  org_array.forEach((org) => {VPB_dict[org.toUpperCase()] = []}); // create dictionary
 
  var VPB_data = SHEET.getRange(vpb_range).getValues(); // get VPB data
  var VPB_filtered = VPB_data.filter(function (el) {return el[0] != "";}); // and filter it so no empty rows
 
  for(var i = 0; i < VPB_filtered.length; i++) {
  
    row = VPB_filtered[i];
    
    var org_code = row[FO_CODE_INDEX].toUpperCase(); // gets the organizer code from the text output sheet
    
    if (org_code == 'NO TURF ASSIGNED' || org_code == 'NO TURF' || org_code == 'NO REGION' || org_code == 'OOS') {
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('Volunteer not turfed'); 
      continue; 
    } 
    
    let org_email = orgs_info[org_code][ORGINFO_EMAIL]; // gets the organizer email from org_info dictionary
    
    if (!org_email || org_email == '') {
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('No FO listed for this volunteer'); 
      continue; 
    } 

    try {
      VPB_dict[org_code].push(row);
    }
    catch(err) {
      Logger.log("ERROR at data[%s], row %s, org %s", i, row, org_code);
      Logger.log("%s: %s", err.name, err.message);
      throw(err);
    }
  }
  
  // Logger.log(text_dict); 
  Logger.log("getVPBData END");

  return VPB_dict;
}



function getTextData(org_array, orgs_info, text_range) {
  
  Logger.log("getTextData START");
  
  var text_dict = {}; 
  org_array.forEach((org) => {text_dict[org.toUpperCase()] = []}); // create dictionary
 
  var text_data = SHEET.getRange(text_range).getValues(); // get dialer data
  var text_filtered = text_data.filter(function (el) {return el[0] != "";}); // and filter it so no empty rows
 
  for(var i = 0; i < text_filtered.length; i++) {
  
    row = text_filtered[i];
    
    var org_code = row[FO_CODE_INDEX].toUpperCase(); // gets the organizer code from the text output sheet
    
    if (org_code == 'NO TURF ASSIGNED' || org_code == 'NO TURF'|| org_code == 'NO REGION' || org_code == 'OOS') {
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('Volunteer not turfed'); 
      continue; 
    } 
    
    let org_email = orgs_info[org_code][ORGINFO_EMAIL]; // gets the organizer email from org_info dictionary
    
    if (!org_email || org_email == '') {
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('No FO listed for this volunteer'); 
      continue; 
    } 

    try {
      text_dict[org_code].push(row);
    }
    catch(err) {
      Logger.log("ERROR at data[%s], row %s, org %s", i, row, org_code);
      Logger.log("%s: %s", err.name, err.message);
      throw(err);
    }
  }
  
  // Logger.log(text_dict); 
  Logger.log("getTextData END");

  return text_dict;
}


function getDialerData(org_array, orgs_info, dialer_range) {
  
  Logger.log("getDialerData START");
  
  var dialer_dict = {}; 
  org_array.forEach((org) => {dialer_dict[org.toUpperCase()] = []}); // create dictionary
 
  var dialer_data = SHEET.getRange(dialer_range).getValues(); // get dialer data
  var dialer_filtered = dialer_data.filter(function (el) {return el[0] != "";}); // and filter it so no empty rows
 
  for(var i = 0; i < dialer_filtered.length; i++) {
    row = dialer_filtered[i];
    
    let org_code = row[FO_CODE_INDEX].toUpperCase(); // gets the organizer code from the dialer ouput sheet
    
    if (org_code == 'NO TURF ASSIGNED' || org_code == 'NO TURF' || org_code == 'NO REGION' || org_code == 'OOS') {
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('Volunteer not turfed'); 
      continue; 
    } 
    
    //if(!orgs_info[org_code][ORGINFO_EMAIL]) {
    
    
    let org_email = orgs_info[org_code][ORGINFO_EMAIL]; // gets the organizer email from org_info dictionary
   
    if (!org_email || org_email == '') {
      Logger.log("ERROR at data[%s], row %s", i, row);
      Logger.log('No FO listed for this volunteer'); 
      continue; 
    } 

    try {
      dialer_dict[org_code].push(row);
    }
    catch(err) {
      Logger.log("ERROR at data[%s], row %s, org %s", i, row, org_code);
      Logger.log("%s: %s", err.name, err.message);
      throw(err);
    }
  }
  
  // Logger.log(dialer_dict); 
  Logger.log("getDialerData END");

  return dialer_dict;
}
