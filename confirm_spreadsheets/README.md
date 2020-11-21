# GOTV Confirm Spreadsheets 
## This project generates spreadsheets to confirm GOTV volunteer shifts as an alternative to using VAN. 

### By Sabrina Chern (Sabrina.chern@2020victory.com) and Brent Efron (Brent.efron@2020.victory.com)
 
The general steps are: 
1. Collect GOTV shifts from CIVIS using confirm_query.sql
2. Populate spreadsheets in the morning (8 AM ET) with that data using runWriteToSheetsVSL1(), runWriteToSheetsVSL2(), and runWriteToSheetsCanvass()
3. Collect data at night (10 PM ET) with runCollectDataFromSheets(). Auto-close those shifts by running [this workflow in Civis](https://platform.civisanalytics.com/spa/#/workflows/23346). 
5. Clearing the confirm sheet, reshift sheet, and Civis Export sheet at 2 AM ET. (walk-in sheet only cleared after each weekend)

Each staging location has a corresponding spreadsheet, and they are all kept in the same folder. There is one "master" spreadsheet that contains the imported data from CIVIS, as well as the data to be exported back to CIVIS at night to auto-close shifts. 

An example of a spreadsheet for a staging location can be found [here](https://docs.google.com/spreadsheets/d/1zVJ8ZWhDKsbfMmzDPo0-1ShYsYfpOdoBcDnOMog5z6U/edit?usp=sharing). It includes: 

- Overview page with VSL toplines 
- Confirm sheet 
  - VAN ID with link to profile
  - Event signup ID
  - Name 
  - Phone Numbers
  - Email
  - First Shift Today, color coded
  - Total # shifts today
  - Next Upcoming Shift
  - Total # upcoming shifts
  - Confirm status
  - When the confirm status was last updated in VAN
  - Pass attempts (call, text)
- Reshift sheet 
- Walk in sheet 
- Copy of the confirm sheet as of yesterday 
- Copy of the reshift sheet as of yesterday

Each staging location has a separate spreadsheet that are all located in one file. The Spreadsheet IDs are kept in the SL Locations sheet of the Master Spreadsheet.

An example master spreadsheet is [here](https://docs.google.com/spreadsheets/d/1vpDcuFy-qOgZyucM2k2QkTVNaICj1jq0phCfyAoGShA/edit?usp=sharing).
