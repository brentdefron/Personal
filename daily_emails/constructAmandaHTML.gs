/* 
Nearly the same as constructPodHTML, except this combines all those tables into one email.
To send all toplines to the organizing director each morning.
*/ 

function sendEmailForAmanda(html_body) { 
  
  var html_full = []; 
  var image_key = '19B-14Y-t9LqnwUAGs8q27Hox8YZkua32';
  var image_data = DriveApp.getFileById(image_key).getBlob();
  
  getAmandaEmailHeader(html_full, image_key);
  
  html_full.push(html_body); 
  
  getPodFooter(html_full); 

  body = html_full.join('\n');
  
  // date with format: "Wed Sep 09"
  let date = new Date().toDateString(); 
  date = date.substring(0, date.length - 5);
  
  let subject = date + " Toplines";
  
  MailApp.sendEmail('amanda.clarke@2020victory.com', subject, "Requires HTML", {cc: 'brent.efron@2020victory.com', name: 'Team Data', htmlBody:body, inlineImages: {image_key: image_data}});
 
  Logger.log("sendEmailForAmanda END");
  
}


function getAmandaEmailBody(html_body, pods_code, pods_info, headers) {
  // gets all POD tables to send to Amanda
  
  Logger.log("getHTMLForAmanda START %s", pods_code);
  
  html_body.push('<H3> <span style="font-weight:bold;">' + pods_code + ' Pod: </span></H3>'); 
  
  getPodBody(html_body, pods_info, headers); 
  
  Logger.log("getHTMLForAmanda END %s", pods_code);



}

function getAmandaEmailHeader(html, image_key) { 
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
  html.push('<div style= "margin: auto, text-align: left; display: inline-block">'); 
  html.push('<H2> <span style="font-weight:bold;"> CONFIRM SHEETS UPDATE 10/21: </span>');  
  html.push("<span style='font-weight:normal;'> There is a new column called 'Trained for Phonebanking?' in the confirm sheets. If the volunteer has completed a phonebanking shift since 10/10, they will appear as Yes."); 
  html.push('</span></H3></div>'); 
  html.push('<p>&nbsp;</p>');
 
  html.push('<div style= "margin: auto, text-align: left; display: inline-block">');
  html.push('<H2> Hi Amanda! </H2><p>&nbsp;</p></div>');
  
  html.push('<div style= "margin: auto, text-align: left; display: inline-block; font-family: Alternate Gothic No3 D">');
  html.push('<H3> <span style="font-weight:normal;"> Here are the regional toplines from yesterday: </span></H3><p>&nbsp;</p></div>'); 
}

