--! Previous: sha1:51773b3fa1100f0be128cef6c71ebbea1fb6717d
--! Hash: sha1:06ac6bb0266c4403fb760b6debbfd6c689d88c4b

--! split: 1-current.sql
drop type if exists pf_public.dataset_statistics_response cascade;

create type pf_public.dataset_statistics_response as (
  dataset_id integer,
  name text,
  unit public.citext,
  warming_scenario text,
  low_value numeric ( 6, 1),
  mid_value numeric(6, 1),
  high_value numeric(6, 1));

drop function if exists pf_public.get_dataset_statistics;

create or replace function pf_public.get_dataset_statistics (lon text, lat text, warming_scenario text, dataset_id integer default null::integer)
  returns setof pf_public.dataset_statistics_response
  language plpgsql
  security definer
  as $$
begin
  if lon::DECIMAL < - 180.0 or lon::DECIMAL > 180.0 then
    raise exception 'Invalid lon param.';
  end if;
  if lat::DECIMAL < - 90.0 or lat::DECIMAL > 90.0 then
    raise exception 'Invalid lat param.';
  end if;
  return QUERY (
    select
      pds.dataset_id as dataset_id, m.name as name, d.unit as unit, pds.warming_scenario, pds.low_value as low_value, pds.mid_value as mid_value, pds.high_value as high_value
    from pf_public.pf_dataset_statistics as pds
    join pf_public.pf_datasets d on d.id = pds.dataset_id
    join pf_public.pf_maps m on m.dataset_id = pds.dataset_id
    where
      pds.coordinate_hash = (
        select
          gc.md5_hash
        from pf_public.pf_grid_coordinates as gc
        where
          gc.grid = 'RCM' order by gc.point <-> ST_SetSRID (ST_MakePoint (get_dataset_statistics.lon::DECIMAL, get_dataset_statistics.lat::DECIMAL), 4326)
    limit 1)
    and (get_dataset_statistics.dataset_id is null
      or pds.dataset_id = get_dataset_statistics.dataset_id)
    and pds.warming_scenario = get_dataset_statistics.warming_scenario);
end;
$$;

grant all on function pf_public.get_dataset_statistics to :PARTNER_ROLE;
