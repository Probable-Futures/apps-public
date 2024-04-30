--! Previous: sha1:04c0b2f36f48b7c6655afcf3d02928d3a70b3c3b
--! Hash: sha1:10d94f91e1d514af53e454969c04d352dd27427d

--! split: 1-add_x_y_columns.sql
alter table
    pf_public.pf_dataset_statistics
add
    column if not exists x numeric [];

alter table
    pf_public.pf_dataset_statistics
add
    column if not exists y numeric [];

--! split: 2-add_x_y_to_statistics_response.sql
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
  x numeric[],
  y numeric[]);

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
      pds.x as x,
      pds.y as y
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
