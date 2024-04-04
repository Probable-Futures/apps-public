--! Previous: sha1:3811ea2f6133e361be4c712ac8f80220031d69de
--! Hash: sha1:135c2b24b3ecec479cd4fe4690a890eda7630831

--! split: 1-current.sql
create or replace function pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50),
  data_labels text[] default null,
  method_used_for_mid text default null,
  status text default null
) returns text language plpgsql security definer 
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
  coalesce(insert_new_version_of_an_existing_map.status, m.status),
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
  ),
  coalesce(insert_new_version_of_an_existing_map.data_labels, m.data_labels),
  coalesce(insert_new_version_of_an_existing_map.method_used_for_mid, m.method_used_for_mid)
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

grant all on function pf_public.insert_new_version_of_an_existing_map (
  dataset_id integer, 
  map_style_id character varying(50),
  data_labels text[],
  method_used_for_mid text,
  status text
  ) to :DATABASE_OWNER;
