--! Previous: sha1:0f4d6b793078c83723e2e9fe50625365b1374fa9
--! Hash: sha1:72b4477a04498501609345403116f1aa10fbfe54

--! split: 1-current.sql
DO
$$
  begin
    alter table pf_public.pf_dataset_statistics
      rename column x to values;
  exception
    when undefined_column then
    end;
$$;

DO
$$
  begin
    alter table pf_public.pf_dataset_statistics
      rename column y to cumulative_probability;
  exception
    when undefined_column then
    end;
$$;

drop type if exists pf_public.dataset_statistics_response cascade;

create type pf_public.dataset_statistics_response as (
  dataset_id integer,
  name text,
  unit public.citext,
  warming_scenario text,
  low_value numeric ( 6, 1),
  mid_value numeric(6, 1),
  high_value numeric(6, 1),
  longitude double precision,
  latitude double precision,
  map_category text,
  values numeric[],
  cumulative_probability numeric[]);

drop function if exists pf_public.get_dataset_statistics;

create or replace function pf_public.get_dataset_statistics (longitude double precision, latitude double precision , warming_scenario numeric[] default null, dataset_id integer default null::integer)
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
      pds.dataset_id as dataset_id, m.name as name, d.unit as unit, pds.warming_scenario, pds.low_value as low_value,
      pds.mid_value as mid_value, pds.high_value as high_value,
      (select lon as longitude from pf_gc), 
      (select lat as latitude from pf_gc),
      d.parent_category as map_category,
      pds.values as values,
      pds.cumulative_probability as cumulative_probability
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
    and (get_dataset_statistics.warming_scenario is null or pds.warming_scenario::numeric = any(get_dataset_statistics.warming_scenario))
  );
end;
$$;

grant all on function pf_public.get_dataset_statistics to :PARTNER_ROLE;
