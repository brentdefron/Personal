function createTrigger() {
  ScriptApp.newTrigger("runWriteToSheetsCanvass")
    .timeBased()
    .atHour(5)
    .nearMinute(0)
    .everyDays(1) // Frequency is required if you are using atHour() or nearMinute()
    .create();
}

function createTriggerclear() {
  ScriptApp.newTrigger("runClearDailySheets")
    .timeBased()
    .atHour(23)
    .nearMinute(0)
    .everyDays(1) // Frequency is required if you are using atHour() or nearMinute()
    .create();
}

function createTriggercollect() {
  ScriptApp.newTrigger("runCollectDataFromSheets")
    .timeBased()
    .atHour(19)
    .nearMinute(5)
    .everyDays(1) // Frequency is required if you are using atHour() or nearMinute()
    .create();
}
