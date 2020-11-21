/*
BFP Archived code
Author (or who future us should bother with questions): Brent Efron
code tldr;
  	OOS Dashboard export
*/

---DIALER---
/*Dialer #s come from ThruTalk Report*/

---TEXTS---
WITH state_to_mycvanid AS 
	(SELECT myc_van_id, state
	FROM my_state_van.coord20_myc_005_person 
	WHERE state_code ilike '%nc%'), 
  
 turfed_instate as
    (SELECT distinct e.email as temail
     FROM my_state_van.activity_regions ar
     LEFT JOIN my_state_van.coord20_myc_001_email_appended e on ar.myc_van_id = e.myc_van_id
     where (ar.region_name ilike '%0%' or ar.region_name ilike '%1%' or ar.region_name ilike '%2%') or ar.region_name ilike '%no%'
    ),
   
   	texts AS 
    (SELECT date(a.timestamp) date_sent,  sender_email, conversation_id
	FROM states_shared_pipeline.thrutext_messages a
	WHERE state_code ilike 'nc' and sender_email is not null),

	emails AS 
    (select * from
	(select *, row_number() over (partition by email order by a.datetime_created desc)
	FROM  my_state_van.contacts_emails_myc a
 	WHERE a.datetime_suppressed is null and state_code ilike '%nc%')
 	WHERE row_number = 1),

	event_date as (select event_date as date_of_text_shift, myc_van_id 
	FROM my_state_van.coord20_myc_003_event_shifts 
	WHERE event_type ilike '%text%' and state_code ilike '%nc%')
 

SELECT CASE WHEN date_sent between '2020-08-21' and '2020-08-27' then '8/21 to 8/27'
	WHEN date_sent between '2020-08-28' and '2020-09-03' then '8/28 to 9/03'
    WHEN date_sent between '2020-09-04' and '2020-09-10' then '9/04 to 9/10'
    WHEN date_sent between '2020-09-11' and '2020-09-17' then '9/11 to 9/17'
    WHEN date_sent between '2020-09-18' and '2020-09-24' then '9/18 to 9/24'
    WHEN date_sent between '2020-09-25' and '2020-10-1' then '9/25 to 10/1'
    WHEN date_sent between '2020-10-2' and '2020-10-8' then '10/2 to 10/8'
    WHEN date_sent between '2020-10-9' and '2020-10-15' then '10/9 to 10/15'
    WHEN date_sent between '2020-10-16' and '2020-10-22' then '10/16 to 10/22'
    WHEN date_sent between '2020-10-23' and '2020-10-29' then '10/23 to 10/29'
    WHEN date_sent between '2020-10-30' and '2020-11-3' then '10/30 to 11/3'
    else null end as Week,
    
    ed.date_of_text_shift,
    stm.myc_van_id,
    
    
    case when (stm.state not ilike '%nc%' and stm.state is not null) and sender_email not in (SELECT temail FROM turfed_instate where temail is not null) and
    
    sender_email not ilike '%2020victory%' then 'OOS' else 'In State' end as IS_os_OOS,
	   count(distinct conversation_id) as texts_sent
    
FROM state_to_mycvanid stm
JOIN emails using(myc_van_id) 
JOIN texts on sender_email = email
JOIN event_date ed on date_of_text_shift = date_sent
group by Week, stm.myc_van_id, date_of_text_shift, IS_os_OOS
order by Week, stm.myc_van_id, date_of_text_shift, IS_os_OOS


---VPB---
With
    
    zips as
    (SELECT distinct zip
     FROM my_state.voter_file_zip9_districts d
     WHERE d.state_code ilike 'nc'
     )

SELECT CASE 
    	WHEN date_canvassed between '2020-09-04' and '2020-09-10' then '9/04 to 9/10'
    	WHEN date_canvassed between '2020-09-11' and '2020-09-17' then '9/11 to 9/17'
    	WHEN date_canvassed between '2020-09-18' and '2020-09-24' then '9/18 to 9/24'
   		WHEN date_canvassed between '2020-09-25' and '2020-10-1' then '9/25 to 10/1'
    	WHEN date_canvassed between '2020-10-2' and '2020-10-8' then '10/2 to 10/8'
    	WHEN date_canvassed between '2020-10-9' and '2020-10-15' then '10/9 to 10/15'
    	WHEN date_canvassed between '2020-10-16' and '2020-10-22' then '10/16 to 10/22'
    	WHEN date_canvassed between '2020-10-23' and '2020-10-29' then '10/23 to 10/29'
    	WHEN date_canvassed between '2020-10-30' and '2020-11-3' then '10/30 to 11/3'
    	else null end as Week,
        
        case when (((date_canvassed < '2020-10-10' and
        c.myv_van_id in (select OOS.myv_van_id from states_nc_lists.oos_segment_20200907 OOS)) or
  (oi.group is not null))                 
                   
                   
        and
        username not like '%thru%' and username not like '%relay%' and username not ilike 'ethanlopez%' and u.email not ilike '%2020victory%' and (p.zip not in (SELECT zip FROM Zips where zip is not null) or p.zip is null) and c.contact_type_id = 1)
        
        
        
        then 'OOS' else 'In State/Unknown' end as IS_or_OOS,
        
        c.date_canvassed,
        
        u.username,

		sum(c.attempt_phone) as attempts, sum(c.phone_canvassed) as canvassed
FROM my_state_van.coord20_myv_001_contacts c
LEFT JOIN my_state_van.coord20_myc_002_users_all u on c.canvassed_by_user_id = u.user_id
JOIN my_state_van.coord20_myc_005_person p on u.myc_van_id = p.myc_van_id
LEFT JOIN states_nc_projects.oos_import oi using (email)
GROUP BY week, c.date_canvassed, u.username, IS_or_OOS
ORDER BY week, c.date_canvassed, u.username, IS_or_OOS
