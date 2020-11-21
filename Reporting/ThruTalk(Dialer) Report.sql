/*
BFP Archived code
Author (or who future us should bother with questions): Brent Efron
code tldr;
  	Export for Dialer Report
*/




---Dialer Report---

with

Dialer_group as(
      SELECT *, 
      CASE 
    
    	WHEN staff_flag = 1 then 'Staff'
    
    	WHEN (turfed_instate_flag = 0) and (staff_flag = 0) and (has_zip_flag = 1) then 'OOS' 
   
    	WHEN (turfed_instate_flag = 1) and staff_flag = 0 then 'In State'
         
    	Else 'Unknown'
    
    	end as Dialer_group
      
      FROM states_nc_pipeline.thrutalk_intermediate),

 event_signups as 
(select event_date as date_called, email as email_address 
from my_state_van.coord20_myc_003_event_shifts 
join my_state_van.coord20_myc_001_email_appended using(state_code,myc_van_id)
where event_type = 'Phone Bank')

, dialer_calls as (select date_canvassed as date_called
, count(*) as all_calls
, sum(case when result_short_name = 'Canvassed' then 1 else 0 end) as canvassed 
from my_state_van.coord20_myv_001_contacts
where contact_type_name = 'Phone' and (input_type_name = 'API' or input_type_name ilike 'bulk') and date_canvassed between '2020-08-01' and '2020-12-31'
group by date_canvassed),

Call_Counter as(
select email_address as email, phone_number as phone, date_called, total_min,
sum(individual_calls) as total_calls
, sum(individual_contacts) as total_contacts 
, sum(talked) as total_talked_to_correct
from

(select email_address, phone_number, date_called, total_min, pct::float*all_calls as individual_calls, pct::float*canvassed as individual_contacts
 
 , talked from
(select *
from states_nc_pipeline.thrutalk_intermediate2
)
join dialer_calls using(date_called))
group by email_address, phone_number, date_called, total_min
  ),
   mobilize_participation as
( select  mp.van_event_signup_id, mp.email, mp.state_code from my_state.coord_mobilize_001_participations_full mp where mp.state_code ilike 'nc' 
),

event_shifts as(
select es.event_date, es.event_name, es.event_signup_id, es.myc_van_id from my_state_van.coord20_myc_003_event_shifts es where es.event_date > '2020-10-09' and es.shift_class_action_shift = 1),

  votepro as
    (select es.event_date, es.myc_van_id, mp.email, case when es.event_name ilike '%Protec%' then 1 else 0 end as votepro_flag
	from event_shifts es
    left join mobilize_participation mp on es.event_signup_id = mp.van_event_signup_id
    where mp.state_code ilike 'nc' and es.event_date > '2020-10-09')
    ,
    
    distributed as
    (select es.event_date, es.myc_van_id, mp.email, case when es.event_name ilike '%ISD_NC_dist%' or es.event_name ilike '%ISD_NC_dia%' then 1 else 0 end as distributed_flag
	from event_shifts es
    left join mobilize_participation mp on es.event_signup_id = mp.van_event_signup_id
    where mp.state_code ilike 'nc' and es.event_date > '2020-10-09')

SELECT 
 CASE WHEN dh.date_called between '2020-08-21' and '2020-08-27' then '2020-08-21'
	WHEN dh.date_called between '2020-08-28' and '2020-09-03' then '2020-08-28'
    WHEN dh.date_called between '2020-09-04' and '2020-09-10' then '2020-09-04'
    WHEN dh.date_called between '2020-09-11' and '2020-09-17' then '2020-09-11'
    WHEN dh.date_called between '2020-09-18' and '2020-09-24' then '2020-09-18'
    WHEN dh.date_called between '2020-09-25' and '2020-10-1' then '2020-09-25'
    WHEN dh.date_called between '2020-10-2' and '2020-10-8' then '2020-10-2'
    WHEN dh.date_called between '2020-10-9' and '2020-10-15' then '2020-10-9'
    WHEN dh.date_called between '2020-10-16' and '2020-10-22' then '2020-10-16'
    WHEN dh.date_called between '2020-10-23' and '2020-10-29' then '2020-10-23'
    WHEN dh.date_called between '2020-10-30' and '2020-11-3' then '2020-10-30'
    end as Week,
	dh.date_called,

	dh.name,
	dh.phone,
    
    Dialer_group,
    
    
  service,
   CASE WHEN votepro_flag = 1 then 'Vote Pro' 
   WHEN distributed_flag = 1 then 'Digital/Distributed'
   else 'Organizing' 
   end as Department,
   case when Dialer_group not like 'Staff' then ar.region_name else 'STAFF' end as Region,
   case when Dialer_group not like 'Staff' then ar.fo_name else 'STAFF' end as FO,
   
   total_min, total_calls, total_contacts, total_talked_to_correct, dh.dialer_time as dialer_min, dh.email
FROM Dialer_group dh
LEFT JOIN votepro on dh.email = votepro.email and dh.date_called = votepro.event_date
LEFT JOIN distributed dist on dh.email = dist.email and dh.date_called = dist.event_date
LEFT JOIN my_state_van.coord20_myc_001_email_appended e on dh.email = e.email
LEFT JOIN my_state_van.coord20_myc_005_person p on e.myc_van_id = p.myc_van_id
LEFT JOIN Call_Counter on dh.date_called = Call_Counter.date_called and lower(dh.email) = lower(Call_Counter.email) and dh.dialer_time = total_min
LEFT JOIN my_state_van.coord20_myc_001_activity_regions ar on p.myc_van_id = ar.myc_van_id
where dh.date_called > '2020-08-9'
	GROUP BY Week, dh.date_called, dh.name, dh.phone, service, total_min, total_calls, total_contacts, total_talked_to_correct, Dialer_group, Department, ar.region_name, ar.fo_name, dh.dialer_time, dh.email
