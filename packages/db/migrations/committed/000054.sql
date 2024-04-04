--! Previous: sha1:df94db8a3027ef439a4fe9bc0a9a64a670cee5e0
--! Hash: sha1:91f782b0537e2c32df87df7b4efe5198ab9a197b

--! split: 1-current.sql
drop function if exists pf_public.get_dataset_statistics;

create or replace function pf_public.get_dataset_statistics (longitude double precision, latitude double precision , warming_scenario text, dataset_id integer default null::integer)
  returns setof pf_public.dataset_statistics_response
  language plpgsql
  security definer
  as $$
begin
  if get_dataset_statistics.longitude::DECIMAL < - 180.0 or get_dataset_statistics.longitude::DECIMAL > 180.0 then
    raise exception 'Invalid longitude param.';
  end if;
  if get_dataset_statistics.latitude::DECIMAL < - 90.0 or get_dataset_statistics.latitude::DECIMAL > 90.0 then
    raise exception 'Invalid latitude param.';
  end if;
  return QUERY 
    (with pf_gc as (
      select
        gc.md5_hash, (ST_X (gc.point::geometry)) as lon, (ST_Y (gc.point::geometry)) as lat from pf_public.pf_grid_coordinates as gc
      where
        gc.grid = 'RCM' order by gc.point <-> ST_SetSRID (ST_MakePoint (get_dataset_statistics.longitude::DECIMAL, get_dataset_statistics.latitude::DECIMAL), 4326)
      limit 1)
    select
      pds.dataset_id as dataset_id, m.name as name, d.unit as unit, pds.warming_scenario, pds.low_value as low_value, pds.mid_value as mid_value, pds.high_value as high_value,
      (select lon as longitude from pf_gc), 
      (select lat as latitude from pf_gc)
    from pf_public.pf_dataset_statistics as pds
    join pf_public.pf_datasets d on d.id = pds.dataset_id
    join pf_public.pf_maps m on m.dataset_id = pds.dataset_id and m.is_latest
    where
    pds.coordinate_hash = (
      select
        md5_hash
      from pf_gc)
    and (get_dataset_statistics.dataset_id is null
      or pds.dataset_id = get_dataset_statistics.dataset_id)
    and pds.warming_scenario = get_dataset_statistics.warming_scenario);
end;
$$;

grant all on function pf_public.get_dataset_statistics to :PARTNER_ROLE;
