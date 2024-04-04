--! Previous: sha1:135c2b24b3ecec479cd4fe4690a890eda7630831
--! Hash: sha1:e5ea60f559bac0115dcdefcdb0c66d7ea8a07e3a

--! split: 1-insert_new_version_of_an_existing_map.sql
drop function if exists pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50)
);

drop function if exists pf_public.insert_new_version_of_an_existing_map(dataset_id integer, map_style_id character varying, data_labels text[], method_used_for_mid text, status text);

create or replace function pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50)
) returns boolean language plpgsql security definer 
as $$ 
begin 
insert into pf_public.pf_maps (
  dataset_id, map_style_id, name, description, 
  stops, bin_hex_colors, status, "order", 
  is_diff, percentage_stops, step, 
  binning_type, bin_labels, slug, 
  is_latest, map_version, data_labels,
  method_used_for_mid
) 
select 
  m.dataset_id, 
  insert_new_version_of_an_existing_map.map_style_id, 
  m.name, 
  m.description, 
  m.stops, 
  m.bin_hex_colors, 
  m.status,
  m."order", 
  m.is_diff, 
  m.percentage_stops, 
  m.step, 
  m.binning_type, 
  m.bin_labels, 
  m.slug,
  true, 
  (
    select 
      max(m2.map_version) + 1 
    from 
      pf_public.pf_maps m2 
    where 
      m2.dataset_id = insert_new_version_of_an_existing_map.dataset_id
  ),
  m.data_labels,
  m.method_used_for_mid
from 
  pf_public.pf_maps m
where 
  m.dataset_id = insert_new_version_of_an_existing_map.dataset_id and m.is_latest is true limit 1;

update 
  pf_public.pf_maps m 
set 
  m.is_latest = false 
where 
  m.dataset_id = insert_new_version_of_an_existing_map.dataset_id and m.map_style_id != insert_new_version_of_an_existing_map.map_style_id;

return true;
end;
$$;

grant all on function pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50)
) to :DATABASE_OWNER;

COMMENT ON FUNCTION pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50)
) IS 
'Insert a new map to the pf_public.pf_maps table. `dataset_id` and `map_style_id` are required by this function. The new record will be created 
with the same attributes of the old one. However, the new record will be set to the latest and its version will be set to the previous version plus one.';

--! split: 2-insert_map_with_a_new_mid_value_method.sql
drop function if exists pf_public.insert_map_with_a_new_mid_value_method;

create or replace function pf_public.insert_map_with_a_new_mid_value_method (
  dataset_id integer, 
  map_style_id character varying(50),
  method_used_for_mid text default null
) returns boolean language plpgsql security definer 
as $$ 
begin 
insert into pf_public.pf_maps (
  dataset_id, map_style_id, name, description, 
  stops, bin_hex_colors, status, "order", 
  is_diff, percentage_stops, step, 
  binning_type, bin_labels, slug, 
  is_latest, map_version, data_labels,
  method_used_for_mid
) 
select 
  m.dataset_id, 
  insert_map_with_a_new_mid_value_method.map_style_id, 
  m.name, 
  m.description, 
  m.stops, 
  m.bin_hex_colors, 
  'draft',
  m."order", 
  m.is_diff, 
  m.percentage_stops, 
  m.step, 
  m.binning_type, 
  m.bin_labels, 
  m.slug,
  false, 
  (
    select 
      max(m2.map_version) 
    from 
      pf_public.pf_maps m2 
    where 
      m2.dataset_id = insert_map_with_a_new_mid_value_method.dataset_id
  ),
  m.data_labels,
  insert_map_with_a_new_mid_value_method.method_used_for_mid
from 
  pf_public.pf_maps m
where 
  m.dataset_id = insert_map_with_a_new_mid_value_method.dataset_id and m.is_latest is true limit 1;

return true;
end;
$$;

grant all on function pf_public.insert_map_with_a_new_mid_value_method (
  dataset_id integer, 
  map_style_id character varying(50),
  method_used_for_mid text
  ) to :DATABASE_OWNER;

COMMENT ON FUNCTION pf_public.insert_map_with_a_new_mid_value_method IS 
'Insert a new map to the pf_public.pf_maps table. All params `dataset_id`, `map_style_id` and `method_used_for_mid` are required by this function. 
Creates a new record by specifying the `method_used_for_mid` param: This will be used to create multiple copies of the same dataset but with different values of `method_used_for_mid`,
eg. mean and median.';
