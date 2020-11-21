/*
BFP Archived code
Table name: N/A
Pipeline/process this was a part of: Daily emails
Author (or who future us should bother with questions): Sabrina Chern
code tldr; Creates HTML for the emails sent out to organizers
*/

function sendEmailForOrg(org_code, org_info_org, dialer_data_org, text_data_org, vpb_data_org, shift_data_org, actives_data_org, dropped_data_org, all_headers) {
  // creates a report and sends a personalized email for each organizer with record
  
  Logger.log("sendEmailForOrg START %s", org_info_org[ORGINFO_NAME]);
  
  if(!org_info_org[ORGINFO_EMAIL] || org_info_org[ORGINFO_EMAIL] == '') { // if no organizer for that turf, don't send any email
    return; 
  }
  
  html = [];
  
  let image_key = '19B-14Y-t9LqnwUAGs8q27Hox8YZkua32'; // image that is the header for the email
  var image_data = DriveApp.getFileById(image_key).getBlob();
  
  // call the functions below to add to the html in order
  getEmailHeader(html, image_key, org_info_org[ORGINFO_NAME]); 
  getDials(html, org_info_org); 
  getOpenShifts(html, org_info_org); 
  getDropped(html, dropped_data_org, all_headers); 
  getShiftsScheduled(html, shift_data_org, all_headers);
  getVolLeaders(html, org_info_org); 
  getActives(html, org_info_org, actives_data_org, all_headers); 
  getVolActivity(html, org_code, dialer_data_org, text_data_org, vpb_data_org, all_headers);
  getEmailFooter(html); 

  body = html.join('\n');
  
  let date = new Date().toDateString(); 
  date = date.substring(0, date.length - 5); // date with format: "Wed Sep 09"
  var subject = date + ' ' + org_code + ' Turf Overview' // ex. Wed Sep 09 01B Turf Overview
  
  // the actual sending of the email
  MailApp.sendEmail(org_info_org[ORGINFO_EMAIL], subject, "Requires HTML", {cc: org_info_org[ORGINFO_ROD] + ', brent.efron@2020victory.com', name: 'Team Data', htmlBody:body, inlineImages: {image_key: image_data}});
  
  Logger.log("sendEmailForOrg END");

}


function getVolLeaders(html, org_info_org) {

  html.push('<div style= "margin: auto, text-align: left; display: inline-block">');
  
  html.push('<H3> <span style="font-weight:bold;"> Volunteer Leaders: </span>'); 

  html.push('<span style="font-weight:normal;"> According to VAN, you currently have ' + org_info_org[ORGINFO_VOL_CONFIRMED] + ' confirmed and ' + org_info_org[ORGINFO_VOL_TESTING] + ' being tested.');
 
  html.push('</span></H3></div>'); 

}


function getActives(html, org_info_org, actives_data_org, all_headers) { 

  if(org_info_org[ORGINFO_ACTIVES_NOT_SCHEDULED] != actives_data_org.length) {
    Logger.log('numbers dont match up'); 
    //html.push('<p> numbers dont match up </p>'); 
  }

  html.push('<div style= "margin: auto, text-align: left; display: inline-block; font-family: Alternate Gothic No3 D">');
  html.push('<H3> <span style="font-weight:bold;"> Active Volunteers Not Scheduled: </span>'); 
  html.push('<span style="font-weight: normal;"> You have ' + org_info_org[ORGINFO_ACTIVES] + ' active volunteers.');
  
  if(org_info_org[ORGINFO_ACTIVES] > 0 && org_info_org[ORGINFO_ACTIVES_NOT_SCHEDULED] == 0) { 
    html.push(' All of your actives have been scheduled for a future shift!</span></H3></div>'); 
  }
  else { 
    html.push(' The following ' + org_info_org[ORGINFO_ACTIVES_NOT_SCHEDULED] + ' are not yet scheduled for another shift in the future:</span></H3></div>');
    
    // Construct Actives yet to be scheduled table
    
    html.push('<div style= "margin: auto; text-align: center; display: inline-block">');
    createHtmlTable(actives_data_org, html, ACTIVES_INDEX_STOP, all_headers.actives_headers); 
    html.push('</div>'); 
  }
  
  html.push('<p>&nbsp;</p><p>&nbsp;</p>');

}

function getShiftsScheduled(html, shift_data_org, all_headers) {
  var num_shifts = shift_data_org.length; 
  
   html.push('<div style= "margin: auto, text-align: left; display: inline-block">');
   
   html.push('<H3> <span style="font-weight:bold;"> Shifts Scheduled: </span>'); 
   html.push('<span style="font-weight: normal;">' + num_shifts + ' action shifts were scheduled in your turf yesterday.</span></H3></div>');
   
   if(num_shifts == 0) {
     return; 
   }

   // Construct Shifts Scheduled table
   
   html.push('<div style= "margin: auto; text-align: center; display: inline-block">');
   //shift_headers = SHEET.getRangeByName(all_headers.shift_headers).getValues()[0];
   createHtmlTable(shift_data_org, html, SHIFT_INDEX_STOP, all_headers.shift_headers);
   html.push('</div>'); 
}

function getDropped(html, dropped_data_org, all_headers) {
  var num_shifts = dropped_data_org.length; 
  
   html.push('<div style= "margin: auto, text-align: left; display: inline-block">');
   
   html.push('<H3> <span style="font-weight:bold;"> Dropped Shifts: </span>'); 
   html.push('<span style="font-weight: normal;">' + num_shifts + ' dropped shifts found in your organizing turf.</span></H3></div>');
   
   if(num_shifts == 0) {
     return; 
   }

   // Construct Dropped Shifts table
   
   html.push('<div style= "margin: auto; text-align: center; display: inline-block">');
   createHtmlTable(dropped_data_org, html, DROPPED_INDEX_STOP, all_headers.dropped_headers);
   html.push('</div>'); 
}


function getEmailFooter(html) {

  html.push('<div style= "margin: auto; text-align: left; display: inline-block">');
  html.push('<H3><span style="font-weight: normal;"> If you believe there are any data errors, please flag for your ROD or </strong><a href="https://forms.gle/xKHn6FnbauNS9ikN7"><strong>submit a Data Ticket</strong></a> (be sure to include VANIDs!)<p>&nbsp;</p>'); 
  html.push('Thanks!<p></p>'); 
  html.push('Team Data</span><H3></div>'); 
  
  
  html.push('<div style= "margin: auto, text-align: center; display: inline-block">');
  html.push('<H4><p style="text-align: center"><span style="font-weight:bold;"> Data Resources: '); 
  html.push('<a href="https://datastudio.google.com/reporting/7a9dd0b2-47e2-4e6d-8f81-ccd671deb6ed/page/FAEiB">GOTV + Phase 3 PTG</a>'); 
  html.push(' | ' + '<a href="https://datastudio.google.com/reporting/65ab7d80-a333-4907-96cc-41533144758e/page/L2xaB">Dropped Shifts Report</a>'); 
  html.push(' | ' + '<a href="https://docs.google.com/spreadsheets/d/1CbC9eDDLfhcovy3Z8vlcXEWzK94meY9fYU33xxOUBEU/edit#gid=0">Data Resources Crib Sheet</a>');
  html.push(' | ' + '<a href="https://datastudio.google.com/u/0/reporting/5b965775-d10b-46a0-85fd-5db1cc5fd8b9/page/VfhcB">Volunteer Activity Report</a>');
  html.push(' | ' + '<a href="https://datastudio.google.com/u/0/reporting/5a212c2d-0b93-4904-9471-afa4a34d4145/page/JSPeB">Active Vols Report</a>');
  html.push(' | ' + '<a href="https://drive.google.com/drive/folders/1gwHypVmRfgyw2LgWY6822m-OaOj3Zx3t">SL Confirm Trackers</a>');
  html.push('</span></p></H4></div>'); 

}


function getDials(html, org_info_org) {

  html.push('<div style= "margin: auto, text-align: left; display: inline-block; font-family: Alternate Gothic No3 D">');

  html.push('<H3> <span style="font-weight:bold;"> Personal Dials: </span> <span style="font-weight:normal;"> You made '+ org_info_org[ORGINFO_DIALS] + ' dials yesterday. ');
  
  if(org_info_org[ORGINFO_DIALS] > 125) {
    html.push('Congratulations on exceeding your daily goal of 125 dials!');
  }
  if(org_info_org[ORGINFO_DIALS] == 125) {
    html.push('Congratulations on meeting your daily goal of 125 dials!');
  }

  html.push('</span></H3></div>'); 

}

function getOpenShifts(html, org_info_org) {

  html.push('<div style= "margin: auto, text-align: left; display: inline-block; font-family: Alternate Gothic No3 D">');
  
  html.push('<H3> <span style="font-weight:bold;"> Open Shifts: </span>'); 
  
  if(org_info_org[ORGINFO_OPEN_SHIFTS] == 0) {
    html.push('<span style="font-weight:normal;"> You currently have no open shifts! Yay!!!');
  }
  else {
    html.push('<span style="font-weight:normal;"> There are currently ' + org_info_org[ORGINFO_OPEN_SHIFTS] + ' open shifts in VAN. Please close these or flag for your ROD.');
  }
  html.push('</span></H3></div>'); 

}

function getEmailHeader(html, image_key, org_name) {
  // get inline image and address email
  
  // get first name of organizer
  var [first, last] = org_name.split(' ');
   
  html.push('<div style= "margin: auto"><img src="cid:image_key" class="center" style="width:1000px;height:250px;"/></div>'); 
  html.push('<p>&nbsp;</p>'); 
  
  html.push('<div style= "margin: auto, text-align: center; display: inline-block">');
  html.push('<H4><p style="text-align: center"><span style="font-weight:bold;"> Data Resources: '); 
  html.push('<a href="https://datastudio.google.com/reporting/7a9dd0b2-47e2-4e6d-8f81-ccd671deb6ed/page/FAEiB">GOTV + Phase 3 PTG</a>'); 
  html.push(' | ' + '<a href="https://datastudio.google.com/reporting/65ab7d80-a333-4907-96cc-41533144758e/page/L2xaB">Dropped Shifts Report</a>'); 
  html.push(' | ' + '<a href="https://docs.google.com/spreadsheets/d/1CbC9eDDLfhcovy3Z8vlcXEWzK94meY9fYU33xxOUBEU/edit#gid=0">Data Resources Crib Sheet</a>');
  html.push(' | ' + '<a href="https://datastudio.google.com/u/0/reporting/5b965775-d10b-46a0-85fd-5db1cc5fd8b9/page/VfhcB">Volunteer Activity Report</a>');
  html.push(' | ' + '<a href="https://datastudio.google.com/u/0/reporting/5a212c2d-0b93-4904-9471-afa4a34d4145/page/JSPeB">Active Vols Report</a>');
  html.push(' | ' + '<a href="https://drive.google.com/drive/folders/1gwHypVmRfgyw2LgWY6822m-OaOj3Zx3t">SL Confirm Trackers</a>');
  html.push('</span></p></H4></div>');
  html.push('<p>&nbsp;</p>'); 
  
  // updated 10/20
  /*html.push('<div style= "margin: auto, text-align: left; display: inline-block">'); 
  //html.push('<H2> <span style="font-weight:bold;"> CONFIRM SHEETS UPDATE 10/21: </span>');  
  html.push("<H2> <span style='font-weight:normal;'> Unfortunately, the ThruTalk caller results have not come in yet, so there won't be any results on this email. "); 
  html.push('</span></H2></div>'); 
  html.push('<p>&nbsp;</p>');*/
  
  
  html.push('<div style= "margin: auto, text-align: left; display: inline-block">');
  html.push('<H2> Hi '+ first +'!</H2><p>&nbsp;</p</div>');

}

function getVolActivity(html, org_code, dialer_data_org, text_data_org, vpb_data_org, all_headers){
  
  // vol activity header
  html.push('<H1><p style="text-align: center"><span style="background-color: #99D8F3; color: #283351;">' + org_code + ' VOLUNTEER ACTIVITY UPDATE</span></p></H1>');
  html.push('<div style= "margin: auto, text-align: left; display: inline-block">');
  html.push('<H2> Here is your volunteer activity update from yesterday<small>*</small>: </H2></div><p>&nbsp;</p>'); 
  
  constructTables(org_code, dialer_data_org, text_data_org, vpb_data_org, html, all_headers); 
}


function constructTables(org_code, dialer_data_org, text_data_org, vpb_data_org, html, all_headers) {
    
    // Construct ThruTalk table

    //dialer_headers = SHEET.getRangeByName(all_headers.dialer_headers).getValues()[0];
    
    html.push('<div style= "margin: auto; text-align: left; display: inline-block">');
    html.push('<H3><span style="font-weight:bold;"> ThruTalk: </span></H3></div>'); 
    html.push('<p></p>'); 
    
    if(!dialer_data_org[0]) {
      Logger.log("No Thrutalk records found for org %s", org_code);
      html.push('<div style= "margin: auto; text-align: center; display: inline-block">');
      html.push('<H3> <span style="font-weight:normal;"> No ThruTalk records found from yesterday </span></H3></div>'); 
      html.push('<p></p>'); 
    }
    else{
      html.push('<div style= "margin: auto; display: inline-block">');
      createHtmlTable(dialer_data_org, html, DIALER_INDEX_STOP, all_headers.dialer_headers);
      html.push('</div>'); 
      html.push('<p></p>'); 
    }
   
    // Construct ThruText table
   
    //text_headers = SHEET.getRangeByName(all_headers.text_headers).getValues()[0];
    
    html.push('<div style= "margin: auto; text-align: left; display: inline-block">');
    html.push('<H3><span style="font-weight:bold;"> ThruText: </span></H3></div><p></p>'); 
    
    if(!text_data_org[0]) {
      Logger.log("No ThruText records found for org %s", org_code);
      html.push('<div style= "margin: auto; text-align: center; display: inline-block">');
      html.push('<H3> <span style="font-weight:normal;"> No ThruText records found from yesterday </span></H3></div>'); 
      html.push('<p></p>'); 
    }
    else{
      html.push('<div style= "margin: auto; display: inline-block">');
      createHtmlTable(text_data_org, html, TEXT_INDEX_STOP, all_headers.text_headers);
      html.push('</div>'); 
      html.push('<p></p>'); 
    }
    
    // Construct the VPB table
 
    //vpb_headers = SHEET.getRangeByName(all_headers.vpb_headers).getValues()[0];
    
    html.push('<div style= "margin: auto; text-align: left; display: inline-block">');
    html.push('<H3><span style="font-weight:bold;"> VPB: </span></H3></div><p></p>');  
    
    
    if(!vpb_data_org[0]) {
      Logger.log("No VPB records found for org %s", org_code);
      html.push('<div style= "margin: auto; text-align: center; display: inline-block">');
      html.push('<H3> <span style="font-weight:normal;"> No VPB records found from yesterday </span></H3></div>'); 
      html.push('<p></p>'); 
    }
    else{
      html.push('<div style= "margin: auto; display: inline-block">');
      createHtmlTable(vpb_data_org, html, VPB_INDEX_STOP, all_headers.vpb_headers);
      html.push('</div>');  
      html.push('<p></p>'); 
    }
    
    html.push('<div style= "margin: auto; text-align: left; display: inline-block">');
    html.push('<H4><span style="font-weight:normal;"> <small>* This data is based on matching either email addresses volunteers entered on ThruTalk and ThruText or the VANID (for VPB callers) to a VAN profile with the same email/VANID. If there is no match, then the volunteer will not show up here. It is also possible that two volunteers in MyC have the same email address, and the wrong profile was attributed to the ThruTalk calls. You are not being held accountable for incorrect data. However, ensuring emails are up to date on VAN and merging duplicate profiles should improve the report accuracy!</small></span></H4>');
    html.push('</div>');
   
}



function createHtmlTable(data, html, col_index_stop, headers) {
  var van_link = 'https://www.votebuilder.com/ContactsDetails.aspx?VANID=EID'; 
  
  html.push('<table class = "center" style="margin-left:auto; margin-right:auto; font-size: 14px; border:2px solid black; border-collapse:collapse;" border = 2 cellpadding = 2>');
  html.push('<tr>');
  
  // create table headers
  for(col = 0; col < headers.length; col++) {
    html.push('<th style="color: white; background-color: "#99D8F3"">' + headers[col] + '</th>');
  }
  html.push('</tr>');
  
  // populate table values
  for(row = 0; row < data.length; row++) {
    html.push('<tr>');
    
    // getting the VAN link for each volunteer
    var link_code = data[row][0]; 
    var link = van_link + link_code; 
    
    for (col = 1; col <= col_index_stop; col++) {
      // VAN ID that links to profile
      if(col == 1) {
        let van_id = data[row][col]; 
        Logger.log(typeof van_id); 
        Logger.log(van_id); 
        var val = '<a href=' + link + '>' + van_id + '</a>';
        html.push('<td>' + val + '</td>');
      }
      else{
        let val = String(data[row][col]);
        //if(col == 5) {val = val.substring(0,15);} // .toFixed(2);}
        html.push('<td>' + val + '</td>');
        
        // if(col > 5) {val = (parseFloat(val)*100).toFixed(2)+ '%';} for percentages if necessary
      }
    }
    html.push('</tr>');
  }
  html.push ('</table>');
}
