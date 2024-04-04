--! Previous: sha1:7fed9102983691cc0ef701c3a4bdbc82072b115c
--! Hash: sha1:cd7140cc9d353619bf73cb946b46ef4d081727c7

--! split: 1-current.sql
alter table 
  pf_public.pf_maps 
add 
  column if not exists slug citext, 
add 
  column if not exists map_version integer, 
add 
  column if not exists is_latest boolean default false;

create or replace function pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50)
) returns boolean language plpgsql strict security definer 
as $$ 
begin 
insert into pf_public.pf_maps (
  dataset_id, map_style_id, name, description, 
  stops, bin_hex_colors, status, "order", 
  is_diff, percentage_stops, step, 
  binning_type, bin_labels, slug, 
  is_latest, map_version
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
      max(map_version) + 1 
    from 
      pf_public.pf_maps m2 
    where 
      m2.dataset_id = insert_new_version_of_an_existing_map.dataset_id
  ) 
from 
  pf_public.pf_maps m
where 
  m.dataset_id = insert_new_version_of_an_existing_map.dataset_id and is_latest is true limit 1;

update 
  pf_public.pf_maps m 
set 
  is_latest = false 
where 
  m.dataset_id = insert_new_version_of_an_existing_map.dataset_id and m.map_style_id != insert_new_version_of_an_existing_map.map_style_id;
return true;
end;
$$;

grant all on function pf_public.insert_new_version_of_an_existing_map (dataset_id integer, 
  map_style_id character varying(50)) to :DATABASE_OWNER;
