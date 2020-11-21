/*BFP Archived code
Table name: n/a
Pipeline/process this was a part of: GOTV REPORT
Author: Brent EFron
---Percent Filled----
SELECT sl.van_name, E.event_role_name,
(count(case when e.event_date = '2020-10-10' then e.event_signup_id end)::float)/(4::float) as DR1_Saturday, 
(count(case when e.event_date = '2020-10-11' then e.event_signup_id end)::float)/(3::float) as DR1_Sunday,
(count(case when e.event_date = '2020-10-17' then e.event_signup_id end)::float)/(4::float) as DR2_Saturday,
(count(case when e.event_date = '2020-10-18' then e.event_signup_id end)::float)/(3::float) as DR2_Sunday,
(count(case when e.event_date = '2020-10-24' then e.event_signup_id end)::float)/(4::float) as DR3_Saturday,
(count(case when e.event_date = '2020-10-25' then e.event_signup_id end)::float)/(3::float) as DR3_Sunday ,
(count(case when e.event_date = '2020-10-31' then e.event_signup_id end)::float)/(4::float) as FF_Saturday,
(count(case when e.event_date = '2020-11-1' then e.event_signup_id end)::float)/(4::float) as FF_Sunday,
(count(case when e.event_date = '2020-11-2' then e.event_signup_id end)::float)/(4::float) as FF_Monday,
(count(case when e.event_date = '2020-11-3' then e.event_signup_id end)::float)/(5::float) as FF_Tuesday
      
     
FROM my_state_van.coord20_myc_003_event_shifts e
LEFT JOIN states_nc_reporting.sl_translation sl on sl.van_name = e.location_name
where e.declined_flag = 0 and (e.event_role_name ilike '%SL%')
GROUP BY sl.van_name, E.event_role_name
ORDER BY sl.van_name, E.event_role_name
---Leader Shifts Scheduled---
SELECT sl.van_name, e.event_role_name, e.region_name,
count(case when e.event_date = '2020-10-10' then e.event_signup_id end) as DR1_Saturday, 
count(case when e.event_date = '2020-10-11' then e.event_signup_id end) as DR1_Sunday,
count(case when e.event_date = '2020-10-17' then e.event_signup_id end) as DR2_Saturday,
count(case when e.event_date = '2020-10-18' then e.event_signup_id end) as DR2_Sunday,
count(case when e.event_date = '2020-10-24' then e.event_signup_id end) as DR3_Saturday,
count(case when e.event_date = '2020-10-25' then e.event_signup_id end) as DR3_Sunday ,
count(case when e.event_date = '2020-10-31' then e.event_signup_id end) as FF_Saturday,
count(case when e.event_date = '2020-11-1' then e.event_signup_id end) as FF_Sunday,
count(case when e.event_date = '2020-11-2' then e.event_signup_id end) as FF_Monday,
count(case when e.event_date = '2020-11-3' then e.event_signup_id end) as FF_Tuesday
      
     
FROM my_state_van.coord20_myc_003_event_shifts e
LEFT JOIN states_nc_reporting.sl_translation sl on sl.van_name = e.location_name
where e.declined_flag = 0 and (e.event_role_name ilike '%SL%')
GROUP BY E.region_name, sl.van_name, E.event_role_name
ORDER BY E.region_name, sl.van_name, E.event_role_name
