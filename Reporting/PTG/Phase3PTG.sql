/*
BFP Archived code
Table name:
Pipeline/process this was a part of: Phase 3 PTG
Author (or who future us should bother with questions): Brent Efron
code tldr; Exports Phase 3 metrics by organizer turf
*/

-----CALLS MADE-----
select
 CASE
  WHEN date_canvassed between '2020-10-01' and '2020-10-08' then '10/01 to 10/08'
  WHEN date_canvassed between '2020-10-09' and '2020-10-15' then '10/09 to 10/15'
  WHEN date_canvassed between '2020-10-16' and '2020-10-22' then '10/16 to 10/22'
    WHEN date_canvassed between '2020-10-23' and '2020-10-29' then '10/23 to 10/29'
    WHEN date_canvassed between '2020-10-30' and '2020-11-03' then '10/30 to 11/03'
    else null end as week,
 coalesce(organizer_code,'none') AS organizer, count(*) AS vol_rec_calls
from  my_state_van.coord20_myc_002_contacts 
 join states_nc_reporting.organizers on user_id = canvassed_by_user_id
where contact_type_name = 'Phone'
 group by week, organizer_code
 
 ----SHIFTS COMPLETED-----
 
 SELECT 
 CASE
 	WHEN event_date between '2020-10-01' and '2020-10-08' then '10/01 to 10/08'
 	WHEN event_date between '2020-10-09' and '2020-10-15' then '10/09 to 10/15'
	WHEN event_date between '2020-10-16' and '2020-10-22' then '10/16 to 10/22'
    WHEN event_date between '2020-10-23' and '2020-10-29' then '10/23 to 10/29'
    WHEN event_date between '2020-10-30' and '2020-11-03' then '10/30 to 11/03'
    else null end as week, 
    case when es.region_name is null then 'unturfed'
    else es.region_name end as region,
 		case when es.fo_name is null then 'unturfed'
    else es.fo_name end as FO,
    count(case when es.shift_class_action_shift=1 or es.event_role_name ilike '%lit drop%' then 1 end) as shifts_completed, count(case when es.event_role_name ilike '%relation%' then 1 end) as relational_shifts_completed
FROM my_state_van.coord20_myc_003_event_shifts es
LEFT JOIN my_state_van.coord20_myc_001_activity_regions ar on es.myc_van_id = ar.myc_van_id
LEFT JOIN my_state_van.coord20_myc_005_person p on ar.myc_van_id = p.myc_van_id
WHERE es.completed_flag = 1 and event_name not ilike '%vopro%' and event_name not ilike '%voter protection%' and event_name not ilike '%vo pro%'
GROUP BY week, es.region_name, es.fo_name 
ORDER BY week, es.fo_name

----ACTIVE VOLUNTEERS----

SELECT
 a.fo_name, count(distinct myc_van_id) as actives
from
(SELECT base_date
, myc_van_id
, reporting_week_start_date
, shifts_completed
, most_recent_event
, first_event_date
, second_most_recent
, case when shifts_completed > 1 then 1 else 0 end as active_vol
, case when active_vol = 1 then second_most_recent + 28 else null end as active_until
, case when shifts_completed = 1 then 1 else 0 end as almost_active 
, case when shifts_completed > 1 and second_most_recent between base_date - 28 and base_date - 21 then 1 else 0 end as near_dropping
from
(select base_date
 , reporting_week_start_date
 , myc_van_id
 , fo_name 
 , region_name 
 , count(*) as shifts_completed
 , max(event_date) as most_recent_event
 , min(event_date) as first_event_date
 , max(case when second_most_recent = 2 then event_date else null end) as second_most_recent
 from
(select base_date, b.reporting_week_start_date, region_name, fo_name
, case when event_date between base_date - 28 and base_date then myc_van_id else null end as myc_van_id
 , event_date
 , row_number() over (partition by myc_van_id, base_date order by event_date desc) as second_most_recent 
from
(select distinct event_date as base_date, reporting_week_start_date
from  my_state_van.coord20_myc_003_event_shifts 
where state_code ilike 'nc') b
cross join 
my_state_van.coord20_myc_003_event_shifts a
where a.state_code = 'NC' and base_date between '2020-01-01' and date(current_date) - 1
and shift_class_action_shift = 1 and completed_flag = 1)
where myc_van_id is not null
group by base_date, myc_van_id, reporting_week_start_date, region_name, fo_name)
order by base_date desc)
left join my_state_van.activity_regions a using(myc_van_id)
where active_vol = 1 and base_date = current_date - 1
group by a.fo_name
