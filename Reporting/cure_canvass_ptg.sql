/*
BFP Archived code
Author (or who future us should bother with questions): Sabrina Chern
code tldr;
  	Creates multiple tables for the Cure Canvassing PTG Report.
*/

-- ptg recruitment calls

select
  CASE
    WHEN date_canvassed between '2020-10-01' and '2020-10-08' then '10/01 to 10/08'
    WHEN date_canvassed between '2020-10-09' and '2020-10-15' then '10/09 to 10/15'
    WHEN date_canvassed between '2020-10-16' and '2020-10-22' then '10/16 to 10/22'
    WHEN date_canvassed between '2020-10-23' and '2020-10-25' then '10/23 to 10/25'
    WHEN date_canvassed between '2020-10-26' and '2020-10-30' then '10/26 to 10/30'
    WHEN date_canvassed between '2020-10-31' and '2020-11-03' then '10/31 to 11/03'
    else null end as week,
  coalesce(r.region_id, Null) AS region_id, 
  r.region_name, 
  r.name, 
  count(*) as vol_rec_calls
from my_state_van.coord20_myc_002_contacts c
join states_nc_reporting.cure_regionals r on r.user_id_1 = c.canvassed_by_user_id or r.user_id_2 = c.canvassed_by_user_id or r.user_id_3 = c.canvassed_by_user_id
where contact_type_name = 'Phone' 
group by week, r.region_id, r.region_name, r.name


-- ptg volunteer shifts

SELECT 
	CASE
      	WHEN event_date between '2020-10-01' and '2020-10-08' then '10/01 to 10/08'
        WHEN event_date between '2020-10-09' and '2020-10-15' then '10/09 to 10/15'
        WHEN event_date between '2020-10-16' and '2020-10-22' then '10/16 to 10/22'
        WHEN event_date between '2020-10-23' and '2020-10-25' then '10/23 to 10/25'
        WHEN event_date between '2020-10-26' and '2020-10-30' then '10/26 to 10/30'
        WHEN event_date between '2020-10-31' and '2020-11-03' then '10/31 to 11/03'
        else null end as week, 
	case 
    	when es.event_name ilike '%greenville%' or es.event_name ilike '%goldsboro%' or es.event_name ilike '%halifax%' or es.event_name ilike '%bertie%' or es.event_name ilike '%elizabeth city%' or es.event_name ilike '%craven%' or es.event_name ilike '%onslow%' or es.event_name ilike '%carteret%' then 1 
        when es.event_name ilike '%new hanover%' or es.event_name ilike '%wilmington%' then 2 
        when es.event_name ilike '%cumberland%' or es.event_name ilike '%harnett%' or es.event_name ilike '%fayetteville%' then 3 
        when es.event_name ilike '%raleigh%' then 4 
        when es.event_name ilike '%durham%' then 5
        when es.event_name ilike '%guilford%' or es.event_name ilike '%greensboro%' then 6 
        when es.event_name ilike '%mecklenburg%' or es.event_name ilike '%charlotte%' then 7 
        when es.event_name ilike '%forsyth%' or es.event_name ilike '%iredell%' or es.event_name ilike '%stokes%' or es.event_name ilike '%davie%' or es.event_name ilike '%surry%' or es.event_name ilike '%davidson%' or es.event_name ilike '%yadkin%' or es.event_name ilike '%winston%' then 8 
        when es.event_name ilike '%western nc%' or es.event_name ilike '%asheville%' or es.event_name ilike '%boone%' then 9 
        else null end as cure_region_id, 
        
    count(case when es.declined_flag = 0 then 1 end) as canvass_shifts_scheduled,
    count(case when es.current_shift_status_name ilike '%confirmed%' then 1 end) as canvass_shifts_confirmed, 
    count(case when es.completed_flag = 1 then 1 end) as canvass_shifts_completed 
    
FROM my_state_van.coord20_myc_003_event_shifts es
where (es.event_name ilike '%cure%' or es.event_name ilike '%absentee%') and es.event_role_name ilike '%canvasser%' 
GROUP BY week, cure_region_id
ORDER BY week, cure_region_id


-- ptg vol shifts on eday

SELECT 
	CASE
      	WHEN event_date = '2020-11-03' then 'eday'
        else null end as week, 
	case 
    	  when es.event_name ilike '%greenville%' or es.event_name ilike '%goldsboro%' or es.event_name ilike '%halifax%' or es.event_name ilike '%bertie%' or es.event_name ilike '%elizabeth city%' or es.event_name ilike '%craven%' or es.event_name ilike '%onslow%' or es.event_name ilike '%carteret%' then 1 
        when es.event_name ilike '%new hanover%' or es.event_name ilike '%wilmington%' then 2 
        when es.event_name ilike '%cumberland%' or es.event_name ilike '%harnett%' or es.event_name ilike '%fayetteville%' then 3 
        when es.event_name ilike '%raleigh%' then 4 
        when es.event_name ilike '%durham%' then 5
        when es.event_name ilike '%guilford%' or es.event_name ilike '%greensboro%' then 6 
        when es.event_name ilike '%mecklenburg%' or es.event_name ilike '%charlotte%' then 7 
        when es.event_name ilike '%forsyth%' or es.event_name ilike '%iredell%' or es.event_name ilike '%stokes%' or es.event_name ilike '%davie%' or es.event_name ilike '%surry%' or es.event_name ilike '%davidson%' or es.event_name ilike '%yadkin%' or es.event_name ilike '%winston%' then 8 
        when es.event_name ilike '%western nc%' or es.event_name ilike '%asheville%' or es.event_name ilike '%boone%' then 9 
        else null end as cure_region_id, 
        
    count(case when es.declined_flag = 0 then 1 end) as canvass_shifts_scheduled,
    count(case when es.current_shift_status_name ilike '%confirmed%' then 1 end) as canvass_shifts_confirmed, 
    count(case when es.completed_flag = 1 then 1 end) as canvass_shifts_completed 
    
FROM my_state_van.coord20_myc_003_event_shifts es
where (es.event_name ilike '%cure%' or es.event_name ilike '%absentee%') and es.event_role_name ilike '%canvasser%' 
GROUP BY week, cure_region_id
ORDER BY week, cure_region_id
