--! Previous: sha1:1ee63efe8335558a2c38e042528291be73c998ec
--! Hash: sha1:51efb716f51a06b577975c5be3db219e5d4078ce

--! split: 1-remove-percentage-stops.sql
alter table pf_public.pf_maps
  drop column if exists percentage_stops;

-- remove percentage_stops from pf_public.insert_new_version_of_an_existing_map
create or replace function pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50),
  map_version integer default null
) returns boolean language plpgsql security definer 
as $$ 
begin 
insert into pf_public.pf_maps (
  dataset_id, map_style_id, name, description, 
  stops, bin_hex_colors, status, "order", 
  is_diff, step, 
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
  m.step, 
  m.binning_type, 
  m.bin_labels, 
  m.slug,
  true,
  -- if map_version is not passed to the function, set it to the last version + 1 
  coalesce(insert_new_version_of_an_existing_map.map_version, (
    select 
      max(m2.map_version) + 1 
    from 
      pf_public.pf_maps m2 
    where 
      m2.dataset_id = insert_new_version_of_an_existing_map.dataset_id
  )),
  m.data_labels,
  m.method_used_for_mid
from 
  pf_public.pf_maps m
where 
  m.dataset_id = insert_new_version_of_an_existing_map.dataset_id and m.is_latest is true limit 1;

update 
  pf_public.pf_maps m 
set 
  is_latest = false 
where 
  m.dataset_id = insert_new_version_of_an_existing_map.dataset_id and m.map_style_id != insert_new_version_of_an_existing_map.map_style_id;

return true;
end;
$$;

-- remove percentage_stops from pf_public.insert_map_with_a_new_mid_value_method
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
  is_diff, step, 
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
