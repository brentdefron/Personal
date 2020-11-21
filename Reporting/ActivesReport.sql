/*
BFP Archived code
Author (or who future us should bother with questions): Brent Efron
code tldr;
  	Export for Actives Report
*/

---ACTIVES---

WITH actives as

(select * from
 
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
left join my_state_van.activity_regions a using(myc_van_id))

SELECT DISTINCT a.myc_van_id
, p.first_name
, p.last_name
, base_date
, case when a.region_name is not null then 'Region ' + a.region_name else 'No Region' end as region
, case when a.fo_name is not null then a.fo_name else 'No Turf' end as fo
, shifts_completed
, most_recent_event
, second_most_recent
, first_event_date
, next_action_shift_scheduled
, active_vol
, active_until
, almost_active 
, near_dropping
, van_obfuscate(a.myc_van_id)

FROM actives a
left join my_state_van.coord20_myc_005_person p on a.myc_van_id = p.myc_van_id

WHERE base_date = current_date - 1 and (active_until > current_date - 1 or almost_active = 1)

order by base_date desc
