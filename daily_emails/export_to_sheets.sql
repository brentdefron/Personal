/*
BFP Archived code
Table name: N/A 
Pipeline/process this was a part of: Daily emails
Author (or who future us should bother with questions): Brent Efron
code tldr; Generated the exports to the master spreadsheet, which provided the information to send out in the daily emails.
*/


------ACTIVE EXPORT------ 

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

SELECT DISTINCT 
van_obfuscate(a.myc_van_id)
, a.myc_van_id
, p.first_name
, p.last_name
, active_until
, case when a.fo_name is not null then a.fo_name else 'No Turf' end as fo
, next_action_shift_scheduled



FROM actives a
left join my_state_van.coord20_myc_005_person p on a.myc_van_id = p.myc_van_id

WHERE base_date = current_date - 1 and (active_until > current_date - 1 or almost_active = 1) and active_vol = 1 and a.myc_van_id is not null

order by base_date desc, active_until asc

-----DIALER EXPORT-----

with
dialer_hours AS 
    (SELECT distinct name as name, email, s.phone, minutes_in_call, minutes_in_wrap_up, minutes_in_ready, SUBSTRING(zip,11 ,5) as zip, sum(minutes_in_call+minutes_in_wrap_up+minutes_in_ready) as dialer_time, cast(s.date as date) as date_called, case when dialer_time > 30 then 1 else 0 end as shift_completed_flag, 'staff only' as service, talked_to_correct_person
FROM states_nc_reporting.thrutalk_staff_callers s
GROUP BY name, email, phone, zip, date_called, minutes_in_call, minutes_in_wrap_up, minutes_in_ready, talked_to_correct_person
	union all
     SELECT distinct name as name, email, phone, minutes_in_call, minutes_in_wrap_up, minutes_in_ready, SUBSTRING(zip,11 ,5) as zip, sum(minutes_in_call+minutes_in_wrap_up+minutes_in_ready) as dialer_time, cast(vc.date as date) as date_called, case when dialer_time > 30 then 1 else 0 end as shift_completed_flag, 'voter contact' as service, talked_to_correct_person
FROM states_nc_reporting.thrutalk_votercontact_callers vc
GROUP BY name, email, phone, zip, date_called, minutes_in_call, minutes_in_wrap_up, minutes_in_ready, talked_to_correct_person
	union all
  		SELECT distinct name as name, email, phone, minutes_in_call, minutes_in_wrap_up, minutes_in_ready, SUBSTRING(zip,11 ,5) as zip, sum(minutes_in_call+minutes_in_wrap_up+minutes_in_ready) as dialer_time, cast(vc.date as date) as date_called, case when dialer_time > 30 then 1 else 0 end as shift_completed_flag, 'Distributed' as service, talked_to_correct_person
FROM states_nc_reporting.thrutalk_distributed_callers vc
GROUP BY name, email, phone, zip, date_called, minutes_in_call, minutes_in_wrap_up, minutes_in_ready, talked_to_correct_person),


dialer_vols as(
select date_called, email as email_address, sum(minutes_in_call + minutes_in_wrap_up + minutes_in_ready) as total_dialer_min, dh.talked_to_correct_person
from dialer_hours dh
where date_called = current_date - 1 and email_address not ilike '%2020victory%' and email_address not ilike 'ncdp'
GROUP BY date_called, email_address, talked_to_correct_person),

emails AS 
    (select * from
	(select *, row_number() over (partition by email order by a.datetime_created desc)
	FROM  my_state_van.contacts_emails_myc a
 	WHERE a.datetime_suppressed is null)
 	WHERE row_number = 1),
    
van_people as 
	(select ar.myc_van_id, ar.region_name, ar.region_id, ar.fo_name, ar.fo_id, p.first_name, p.last_name from my_state_van.coord20_myc_005_person p 
	left join my_state_van.activity_regions ar using(myc_van_id)), 
    
dialer_with_org as(
SELECT  van_obfuscate(emails.myc_van_id), emails.myc_van_id, p.first_name, p.last_name as myc_link, total_dialer_min, case when p.fo_name is not null then p.fo_name else 'no turf assigned' end as FO
FROM dialer_vols dv
LEFT JOIN emails on dv.email_address = emails.email
LEFT JOIN van_people p on emails.myc_van_id = p.myc_van_id
WHERE emails.datetime_suppressed is null and emails.myc_van_id is not null
ORDER BY FO)

SELECT *
FROM dialer_with_org
ORDER BY FO, total_dialer_min asc
							 
----TEXT EXPORT----

WITH state_to_mycvanid AS
	(SELECT myc_van_id, state
	FROM my_state_van.coord20_myc_005_person
	WHERE state_code ilike '%nc%'),
    texts AS
    (SELECT distinct date(a.timestamp) date_sent,  sender_email, conversation_id
	FROM states_shared_pipeline.thrutext_messages a
	WHERE sender_email is not null and state_code ilike '%nc%'),
    emails AS
    (select * from
	(select *, row_number() over (partition by email order by a.datetime_created desc)
	FROM  my_state_van.contacts_emails_myc a
 	WHERE a.datetime_suppressed is null)
 	WHERE row_number = 1),
    event_date as (select event_date as date_of_text_shift, myc_van_id
	FROM my_state_van.coord20_myc_003_event_shifts
	WHERE event_type ilike '%gotv%' or event_type ilike '%text%'),
    thrutext_with_org AS
    (SELECT van_obfuscate(emails.myc_van_id) as myc_link, emails.myc_van_id, p.first_name, p.last_name, count(distinct conversation_id) as texts_sent, case when ar.fo_name is not null then ar.fo_name else 'no turf assigned' end as FO
    FROM state_to_mycvanid stm
	LEFT JOIN emails using(myc_van_id)
	LEFT JOIN texts t on sender_email = email
	LEFT JOIN event_date on cast(date_of_text_shift as date) = cast(date_sent as date)
    LEFT JOIN my_state_van.activity_regions ar on emails.myc_van_id = ar.myc_van_id
	LEFT JOIN my_state_van.coord20_myc_005_person p on emails.myc_van_id = p.myc_van_id
	WHERE emails.datetime_suppressed is null and date(date_of_text_shift) = '2020-10-25' and emails.myc_van_id is not null
	GROUP BY t.sender_email, date_of_text_shift, emails.myc_van_id, ar.fo_name, p.first_name, p.last_name
    ORDER BY FO)
    SELECT *
    FROM thrutext_with_org
    WHERE texts_sent > 0
    ORDER BY FO, texts_sent asc
    
    ----VPB EXPORT----
    
  SELECT van_obfuscate(u.myc_van_id) as myc_link, u.myc_van_id, p.first_name, p.last_name,  count(c.myv_van_id) as vpb_attempts,  case when ar.fo_name is not null then ar.fo_name else 'no turf assigned' end as FO
FROM my_state_van.coord20_myv_001_contacts c 
LEFT JOIN my_state_van.coord20_myc_002_users_all u on c.canvassed_by_user_id = u.user_id
LEFT JOIN my_state_van.activity_regions ar on u.myc_van_id = ar.myc_van_id
LEFT JOIN my_state_van.coord20_myc_005_person p on u.myc_van_id = p.myc_van_id
WHERE username not like '%thru%' and username not like '%relay%' and username not ilike 'ethanlopez%' and c.date_canvassed = current_date - 1 and c.contact_type_id = 1 AND u.myc_van_id IS NOT NULL
GROUP BY u.email, date_canvassed, u.myc_van_id, FO, p.first_name, p.last_name
ORDER BY FO, vpb_attempts asc
  
    ----YESTERDAY'S CALLS----
    
 SELECT u.first_name + ' ' + u.last_name as name, count(date_canvassed) as attempts
FROM my_state_van.coord20_myc_002_contacts c
JOIN my_state_van.coord20_myc_002_users_all u on c.canvassed_by_user_id = u.user_id
WHERE date_canvassed = current_date - 1 and c.contact_type_id = 1
group by u.first_name, u.last_name
  
    ----SHIFTS SCHEDULED EXPORT----
 SELECT van_obfuscate(p.myc_van_id), p.myc_van_id, p.first_name, p.last_name, es.event_name, cast(es.event_date as date) as event_date, case when ar.fo_name is not null then ar.fo_name else 'no turf assigned' end as FO
FROM my_state_van.coord20_myc_003_event_shifts es
LEFT JOIN my_state_van.coord20_myc_001_activity_regions ar on es.myc_van_id = ar.myc_van_id
LEFT JOIN my_state_van.coord20_myc_005_person p on ar.myc_van_id = p.myc_van_id
WHERE es.initial_event_signup_date = current_date - 1 and shift_class_action_shift = 1 and p.myc_van_id is not null
ORDER BY FO, es.event_date asc
  
      ----OPEN SHIFTS----
   WITH vpb_activity AS
(select myc_van_id, date_canvassed, count(*) as vpb_total, sum(phone_canvassed) as vpb_contacts
from my_state_van.coord20_myv_001_contacts
join
                  (select distinct myc_van_id, public_user_id
from
(select myc_van_id, public_user_id
from
my_state_van.public_users
union all
select myc_van_id_two, public_user_id
from
(select distinct a.myc_van_id as myc_van_id_one, b.myc_van_id as myc_van_id_two
from
(select myc_van_id, upper(email) as email
from my_state_van.contacts_emails_myc
where upper(email)  in
(select upper(email) as email
from
(select upper(email) as email, count(distinct myc_van_id) count_
from my_state_van.contacts_emails_myc
 where state_code = 'NC'
group by email
having count_ between 2 and 10000))) a
join
(
  select myc_van_id, upper(email) as email
from my_state_van.contacts_emails_myc
where upper(email) in
(select upper(email) as email
from
(select upper(email) as email, count(distinct myc_van_id) count_
from my_state_van.contacts_emails_myc
 where state_code = 'NC'
group by email
having count_ between 2 and 10000))) b
on a.email ilike b.email and a.myc_van_id != b.myc_van_id)
join
my_state_van.public_users on myc_van_id = myc_van_id_one))
                  on canvassed_by_user_id = public_user_id
where input_type_name = 'OpenVPB'
                 group by myc_van_id, date_canvassed), 
dialer AS 
  (select myc_van_id, date(date_called) as date_canvassed
  , minutes_in_ready::float+minutes_in_call::float as minutes_active_dialer
  , talked_to_correct_person as conversations_dialer
  , minutes_in_call::float+minutes_in_wrap_up::float+minutes_in_ready::float+minutes_in_not_ready::float as minutes_total_dialer
  from my_state.coord_thrutalk_001_bg_callers a
  join  my_state_van.coord20_myc_001_email_appended on  upper(email_address) = upper(email)
  where a.state_code = 'NC'), 
text_data AS (
    select * from
    my_state_van.coord20_myc_001_email_appended
   join (select date(timestamp_edt) as text_date, sender_email, count(*) as texts_sent
  from
  (select *, CONVERT_TIMEZONE('UTC', 'EDT', a.timestamp::datetime) as timestamp_edt
   from states_shared_pipeline.thrutext_messages a
   where state_code ilike 'NC'
   )
  group by text_date, sender_email) on email ilike sender_email), 
hannah_open_shifts as
 
  (select * from
  (select a.event_signup_id as event_signup_id
   , a.myc_van_id AS van_id
  , event_id
  , event_shift_id as shift_id
  , event_role_id as role_id
  , case
  when
      event_role_name = 'Texter' and event_date between '2010-01-01' and current_date - 1
      and texts_sent between 300 and 100000000 then 2
  when
      event_role_name = 'Texter' and event_date between '2010-01-01' and current_date - 2
  then 6
  when
      (event_role_name ilike '%dialer%' or event_role_name ilike '%phone%')
      and (minutes_total_dialer > 29.99 or vpb_total > 19)
      and event_date between '2010-01-01' and current_date
      then 2
  when
      (event_role_name ilike '%dialer%' or event_role_name ilike '%phone%')
      and event_date between '2010-01-01' and current_date - 14
      then 6
  when event_date between '2010-01-01' and current_date - 14
  then 6
  else null end as status_id
  , CAST(REPLACE(national_event_location_id,national_event_id,'') AS INT) as location_id
  from my_state_van.coord20_myc_003_event_shifts a
  left join vpb_activity as b on a.myc_van_id = b.myc_van_id and event_date = date_canvassed
  left join dialer as c on a.myc_van_id = c.myc_van_id and c.date_canvassed = event_date
  left join text_data as d on d.myc_van_id = a.myc_van_id and text_date = event_date
  where is_open_flag = 1 and shift_in_future = 0)
  where status_id is not null), 
 
 
brent_open_shifts as 
(SELECT van_obfuscate(p.myc_van_id), p.myc_van_id, p.first_name, p.last_name, es.event_signup_id as event_signup_id, es.event_name, es.event_date, case when ar.fo_name is not null then ar.fo_name else 'no turf assigned' end as FO, es.current_shift_status_name
FROM my_state_van.coord20_myc_003_event_shifts es
LEFT JOIN my_state_van.coord20_myc_001_activity_regions ar on es.myc_van_id = ar.myc_van_id
LEFT JOIN my_state_van.coord20_myc_005_person p on ar.myc_van_id = p.myc_van_id
WHERE es.event_date < current_date and p.myc_van_id is not null and es.is_open_flag = 1 and es.current_shift_status_name not ilike 'cancelled' and shift_class_action_shift = 1 and es.event_date > current_date - 60)
 
select 
	van_obfuscate(b.myc_van_id), b.myc_van_id, b.first_name, b.last_name, b.event_signup_id, b.event_name, b.event_date, b.fo, b.current_shift_status_name
from brent_open_shifts b
left join hannah_open_shifts h using(event_signup_id)
where h.van_id is null;

  ----VOL LEADER EXPORT----
  select van_obfuscate(r.myc_van_id), r.myc_van_id, p.first_name, p.last_name, r.survey_response_name_truncated, case when ar.fo_name is not null then ar.fo_name else 'no turf assigned' end as FO
from my_state_van.coord20_myc_002_responses r
left join my_state_van.coord20_myc_005_person p on r.myc_van_id = p.myc_van_id
LEFT JOIN my_state_van.coord20_myc_001_activity_regions ar on r.myc_van_id = ar.myc_van_id
where survey_question_name_truncated ilike 'SQ2020 Vol Leader' and r.sq_most_recent_response = 1 and r.myc_van_id is not null

  ----SHIFTS COMPLETED----
 SELECT van_obfuscate(p.myc_van_id), p.myc_van_id, p.first_name, p.last_name, es.event_name, case when ar.fo_name is not null then ar.fo_name else 'no turf assigned' end as FO
FROM my_state_van.coord20_myc_003_event_shifts es
LEFT JOIN my_state_van.coord20_myc_001_activity_regions ar on es.myc_van_id = ar.myc_van_id
LEFT JOIN my_state_van.coord20_myc_005_person p on ar.myc_van_id = p.myc_van_id
WHERE shift_class_action_shift = 1 and p.myc_van_id is not null and es.event_date = current_date - 1 and es.completed_flag = 1
ORDER BY FO, es.event_date asc
	
 ----DROPPED SHIFTS----
SELECT van_obfuscate(myc_van_id), myc_van_id, first_name, last_name, event_name, event_role_name, shift_time, fo_name, shift_readded, region_name
FROM states_nc_reporting.suppressed_shifts_past_7days
 ----REGIONAL RESHIFT RATE----
WITH
Completed as
(SELECT distinct e.myc_van_id, e.fo_name, e.region_name, e.shift_class_action_shift
FROM my_state_van.coord20_myc_003_event_shifts e
WHERE e.event_date = current_date - 1 and (e.region_name ilike '%0%' or e.region_name ilike '%1%' or e.region_name ilike '%2%') and e.completed_flag = 1 and e.event_name not ilike '%voter protection%' and e.shift_class_action_shift = 1),

Scheduled_future as
(SELECT distinct e.myc_van_id, e.fo_name, e.region_name,case when e.initial_event_signup_date = current_date - 1 then 1 else 0 end as sameday_reshift_flag 
FROM my_state_van.coord20_myc_003_event_shifts e
WHERE e.event_date >= current_date and (e.region_name ilike '%0%' or e.region_name ilike '%1%' or e.region_name ilike '%2%') and e.declined_flag = 0 and e.completed_flag = 0 and e.event_name not ilike '%voter protection%' and e.shift_class_action_shift = 1)

SELECT 
c.region_name, count(s.myc_van_id)::float/count(c.myc_van_id)::float as all_reshift, sum(sameday_reshift_flag)::float/count(c.myc_van_id)::float as same_day_reshift, 1-all_reshift as not_reshifted_pct, count(c.myc_van_id) - count(s.myc_van_id) as not_reshifted
FROM completed c
LEFT JOIN scheduled_future s on c.myc_van_id = s.myc_van_id
GROUP BY c.region_name
ORDER BY c.region_name
----REGIONAL CONFIRM RATE----
WITH
Scheduled as
(SELECT distinct e.myc_van_id, e.fo_name, e.region_name
FROM my_state_van.coord20_myc_003_event_shifts e
WHERE e.event_date = current_date and (e.region_name ilike '%0%' or e.region_name ilike '%1%' or e.region_name ilike '%2%') and e.event_name not ilike '%voter protection%' and e.is_open_flag = 1),

Confirmed as
(SELECT distinct e.myc_van_id, e.fo_name, e.region_name
FROM my_state_van.coord20_myc_003_event_shifts e
WHERE e.event_date = current_date and (e.region_name ilike '%0%' or e.region_name ilike '%1%' or e.region_name ilike '%2%') and e.event_name not ilike '%voter protection%' and current_shift_status_name ilike '%conf%')

SELECT s.region_name, count(c.myc_van_id) ::float/count(s.myc_van_id)::float as same_day_confirm_rate
FROM Scheduled s
LEFT JOIN Confirmed c on s.myc_van_id = c.myc_van_id
GROUP BY s.region_name
ORDER BY s.region_name
----TIMESTAMP----
select cast(current_timestamp as timestamp) 
