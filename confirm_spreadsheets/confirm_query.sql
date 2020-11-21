/*
BFP Archived code
Table name:
Pipeline/process this was a part of: GOTV confirm spreadsheets
Author (or who future us should bother with questions): Brent Efron and Sabrina Chern
code tldr; Exports necessary information to populate confirm sheets. Includes a list of all the shifts for a particular GOTV weekend, as well as a list of all the distinct volunteers for a reshift list. 
*/

WITH

SHIFTS AS

(SELECT
	myc_van_id, e.event_signup_id,
    ROW_NUMBER() OVER(PARTITION BY myc_van_id ORDER BY shift_datetime_offset_begin desc) AS "ROW",
 	shift_datetime_offset_begin
    
FROM 
	my_state_van.coord20_myc_003_event_shifts e
WHERE
    e.declined_flag = 0 and (e.event_role_name ilike '%dialer%' or e.event_role_name ilike '%phone%' or e.event_role_name ilike '%canvasser%') and e.event_date > '2020-10-20'),
    
SHIFTS2 AS

(SELECT
	myc_van_id,
    ROW_NUMBER() OVER(PARTITION BY myc_van_id ORDER BY shift_datetime_offset_begin desc) AS "ROW",
 	shift_datetime_offset_begin as next
    
FROM 
	my_state_van.coord20_myc_003_event_shifts e
WHERE
    e.declined_flag = 0 and (e.event_role_name ilike '%dialer%' or e.event_role_name ilike '%phone%' or e.event_role_name ilike '%canvasser%') and e.event_date > '2020-10-20'),    
    
NEXT as

( SELECT
    s1.myc_van_id, event_signup_id, s1.shift_datetime_offset_begin as now, next, s1.row - 1 as shifts_in_future
    FROM SHIFTS s1
    LEFT JOIN SHIFTS2 s2 on s1.myc_van_id = s2.myc_van_id and s1.ROW = s2.ROW+1
    ORDER BY myc_van_id),

SHIFTS_TODAY as

(SELECT myc_van_id, event_date, count(event_signup_id) as shifts_today
 FROM my_state_van.coord20_myc_003_event_shifts e
 WHERE e.declined_flag = 0 and (e.event_role_name ilike '%dialer%' or e.event_role_name ilike '%phone%' or e.event_role_name ilike '%canvasser%') and e.event_date > '2020-10-14' and  e.event_name ilike '%gotv%'
 GROUP BY e.myc_van_id, event_date),
 
SHIFT_IN_FUTURE as
(SELECT myc_van_id, 
	ROW_NUMBER() OVER(PARTITION BY myc_van_id ORDER BY shift_datetime_offset_begin desc) as shifts_left_plus_one,
 	event_date
 	 FROM my_state_van.coord20_myc_003_event_shifts e
	 WHERE e.declined_flag = 0 and (e.event_role_name ilike '%dialer%' or e.event_role_name ilike '%phone%' or e.event_role_name ilike '%canvasser%') and e.event_date > '2020-10-20'
     ORDER BY myc_van_id, shifts_left_plus_one),
     
SHIFT_IN_FUTURE2 as
(SELECT myc_van_id, event_date, max(shifts_left_plus_one)-1 as shifts_in_future
FROM shift_in_future
GROUP BY myc_van_id, event_date),

Training_Flag as
(select e.myc_van_id, case when (event_name ilike '%Statewide Canvass Training%' or event_name ilike '%RSW_absenteeballottrain%') and completed_flag = 1 then 1 else 0 end as canvass_training_flag
 
 , case when (e.event_role_name ilike '%dialer%' or e.event_role_name ilike '%phone%') and completed_flag = 1 and event_date > '2020-10-09' then 1 else 0 end as Prior_Phone_Banker_flag 
from my_state_van.coord20_myc_003_event_shifts e
where completed_flag = 1 )
 
 
select * from (
SELECT van_obfuscate(e.myc_van_id), e.myc_van_id, e.event_signup_id, 

case when p.first_name is null and p.last_name is not null then p.last_name
		 when p.first_name is not null and p.last_name is null then p.first_name
     when p.first_name is null and p.last_name is null then 'no name'
     else p.first_name + ' ' + p.last_name end as name,

case 
when tf.canvass_training_flag = 1 and e.event_role_name ilike '%canvass%' then 'Yes'
when tf.canvass_training_flag = 0 and e.event_role_name ilike '%canvass%' then 'No'
when e.event_role_name not ilike '%canvass%' then 'N/A'
else 'No' end as completed_training,

 p.primary_myc_landline, p.primary_myc_cell, p.primary_myc_email, e.shift_datetime_offset_begin, shifts_today, next as next_shift, shifts_in_future, e.current_shift_status_name

 ,CAST((es.datetime_modified AT TIME ZONE 'UTC-04') AS DATETIME) as datetime_modified_es
 
  , case 
when tf.Prior_Phone_Banker_flag = 1 and (e.event_role_name ilike '%dialer%' or e.event_role_name ilike '%phone%') then 'Yes'
when tf.Prior_Phone_Banker_flag = 0 and (e.event_role_name ilike '%dialer%' or e.event_role_name ilike '%phone%') then 'No'
when (e.event_role_name ilike '%canvass%') then 'N/A'
else 'No' end as Phonebank_Trained
           
, e.location_name as Staging_Location, sl.region, ROW_NUMBER() OVER(PARTITION BY e.event_signup_id ORDER BY completed_training desc) AS "ROW"
FROM my_state_van.coord20_myc_003_event_shifts e
LEFT JOIN states_nc_reporting.sl_translation sl on sl.van_name = e.location_name
LEFT JOIN my_state_van.coord20_myc_005_person p on e.myc_van_id = p.myc_van_id
LEFT JOIN NEXT using (event_signup_id)
LEFT JOIN SHIFTS_TODAY t on e.myc_van_id = t.myc_van_id and e.event_date = t.event_date
LEFT JOIN SHIFT_IN_FUTURE f on e.myc_van_id = f.myc_van_id and e.event_date = f.event_date
LEFT JOIN my_state_van.event_signups es on e.event_signup_id = es.event_signup_id
LEFT JOIN Training_Flag tf on e.myc_van_id = tf.myc_van_id
where e.declined_flag = 0 and (e.event_role_name ilike '%dialer%' or e.event_role_name ilike '%phone%' or e.event_role_name ilike '%canvasser%') and e.event_name ilike '%gotv%' and e.event_date between '2020-10-24' and '2020-10-25' and e.event_date > current_date - 1 and e.location_name is not null and e.current_shift_status_name not ilike '%canc%' 
GROUP BY e.event_signup_id, e.myc_van_id, e.event_role_name, completed_flag, p.first_name, p.last_name, p.primary_myc_landline, p.primary_myc_cell, primary_myc_email, e.shift_datetime_offset_begin,shifts_today, next.next, e.location_name, sl.region,  e.current_shift_status_name, datetime_modified_es, shifts_in_future, tf.canvass_training_flag, tf.Prior_Phone_Banker_flag
ORDER BY shift_datetime_offset_begin, e.location_name, name) 

where row = 1
