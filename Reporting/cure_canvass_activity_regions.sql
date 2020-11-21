/*
BFP Archived code
Table name: states_nc_reporting.cure_activity_regions
Pipeline/process this was a part of: Part of creating Cure Canvass PTG
Author: Sabrina Chern
code tldr; 
  Takes the counties from VAN profiles to assign them to a cure region. If the person has no county, then we take the answer to a survey question that we made to determine their county (if they have an answer).
  Taking both of these groups of people together allows us to include the most number of people in our Cure Canvassing Universe.
*/


create table states_nc_reporting.cure_activity_regions as 

(select
		p.myc_van_id, 
    t.county_name,
    t.region_name as cure_region_name, 
    t.region_id as cure_region_id, 
    p.region_name as van_region_name, 
    p.region_id as van_region_id, 
    p.fo_name, 
    p.fo_id
from my_state_van.coord20_myc_005_person p 
left join states_nc_reporting.cure_county_to_region_translation t on p.county_name = t.county_name
where p.county_name is not null and t.county_name is not null

union all
 
select 
		p.myc_van_id, 
    t.county_name, 
  	t.region_name as cure_region_name, 
    t.region_id as cure_region_id, 
    p.region_name as van_region_name, 
    p.region_id as van_region_id, 
    p.fo_name, 
    p.fo_id
from my_state_van.coord20_myc_005_person p 
left join my_state_van.coord20_myc_002_responses r on p.myc_van_id = r.myc_van_id
left join states_nc_reporting.cure_county_to_region_translation t on r.survey_response_name_truncated = t.county_name
where p.county_name is null and r.survey_question_id = 427452)
