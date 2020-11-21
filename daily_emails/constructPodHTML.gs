/*
BFP Archived code
Table name: N/A
Pipeline/process this was a part of: Daily emails
Author (or who future us should bother with questions): Sabrina Chern
code tldr; Creates HTML for the emails sent out to RODs and DODs
*/

function sendEmailForPod(pods_code, pods_info, headers) {
  // creates a report and sends a personalized email for each pod (DOD + multiple RODs)

  Logger.log("sendEmailForPod START %s", pods_info[0][PODINFO_KEY]);
  
  html = [];
  
  let image_key = '19B-14Y-t9LqnwUAGs8q27Hox8YZkua32'; // image used as header in email
  var image_data = DriveApp.getFileById(image_key).getBlob();
  
  // generate html for email
  getPodHeader(html, image_key, pods_code, pods_info, headers);
  getPodBody(html, pods_info, headers); 
  getPodFooter(html); 

  body = html.join('\n');
  
  // date with format: "Wed Sep 09"
  let date = new Date().toDateString(); 
  date = date.substring(0, date.length - 5);
  
  let subject = "(" + pods_code + " Pod) " + date + " Toplines"; // ex. (East Pod) Wed Sep 09 Toplines
  
  var dod_email = pods_info[0][PODINFO_DOD]; 
  
  var rod_emails = ''; 
  pods_info.forEach((region) => rod_emails += ', ' + region[PODINFO_ROD]); 
  rod_emails = rod_emails.substring(2,rod_emails.length); // comma separated list of all the rods to send the email to
 
  // send the email
  MailApp.sendEmail(rod_emails, subject, "Requires HTML", {cc: dod_email + ', brent.efron@2020victory.com', name: 'Team Data', htmlBody:body, inlineImages: {image_key: image_data}});
  
  Logger.log("sendEmailForPod END");

}

function getPodHeader(html, image_key, pods_code) { 
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
  html.push('<H2> <span style="font-weight:bold;"> CONFIRM SHEETS UPDATE 10/21: </span>');  
  html.push("<span style='font-weight:normal;'> There is a new column called 'Trained for Phonebanking?' in the confirm sheets. If the volunteer has completed a phonebanking shift since 10/10, they will appear as Yes."); 
  html.push('</span></H3></div>'); 
  html.push('<p>&nbsp;</p>');*/
  
  
  
  html.push('<div style= "margin: auto, text-align: left; display: inline-block">');
  html.push('<H2> Hi '+ pods_code +'!</H2><p>&nbsp;</p></div>');
  
  html.push('<div style= "margin: auto, text-align: left; display: inline-block; font-family: Alternate Gothic No3 D">');
  html.push('<H3> <span style="font-weight:normal;"> Here are your regional toplines from yesterday: </span></H3></div>'); 

}

function getPodBody(html, pods_info, headers) {
    
  // Construct table with regions
  html.push('<div style= "margin: auto; text-align: center; display: inline-block">');
  createHtmlPodTable(pods_info, html, headers); 
  html.push('</div><p>&nbsp;</p>'); 

}

function getPodFooter(html) { 

  html.push('<div style= "margin: auto; text-align: left; display: inline-block">'); 
  html.push('<H3><span style="font-weight: normal;">Thanks!<p></p>'); 
  html.push('Team Data</span><H3></div>'); 

}
  

function createHtmlPodTable(data, html, headers) {
  //var van_link = 'https://www.votebuilder.com/ContactsDetails.aspx?VANID=EID'; 
  
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
    
    for (col = 0; col < data[row].length; col++) {

      if(col != PODINFO_ROD && col != PODINFO_DOD && col != PODINFO_KEY) {  
        let val = data[row][col]; 
        if(col > 7 && col != 11) {val = (parseFloat(val)*100).toFixed(0)+ '%';} // for percentages 
        else { val = String(val); }
        html.push('<td>' + val + '</td>');
      }
     
    }
    html.push('</tr>');
  }
  html.push ('</table>');
}
