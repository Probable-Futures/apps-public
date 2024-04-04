--! Previous: sha1:5a310f357998f5fd5d95d74a7a115700476d48b4
--! Hash: sha1:632b00152e0fac234d3bc7fa9ecbaa77b53994da

--! split: 1-current.sql
drop function if exists pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50)
);

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
  m.is_latest = false 
where 
  m.dataset_id = insert_new_version_of_an_existing_map.dataset_id and m.map_style_id != insert_new_version_of_an_existing_map.map_style_id;

return true;
end;
$$;

grant all on function pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50),
  map_version integer
) to :DATABASE_OWNER;

COMMENT ON FUNCTION pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50),
  map_version integer
) IS 
'Insert a new map to the pf_public.pf_maps table. `dataset_id` and `map_style_id` are required by this function. The new record will be created 
with the same attributes of the old one. However, the new record will be the latest and its version will be set to the previous version plus one unless it is specified in the params.';
