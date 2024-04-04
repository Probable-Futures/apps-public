--! Previous: sha1:fd5dfb8e95dcdea8c30c0354d7cd9fd6d96ad92f
--! Hash: sha1:ee3a8b7d11d28bfdde4484dfbac520f386724311

--! split: 1-current.sql
drop view if exists pf_private.aggregate_pf_dataset_statistic_cells;

alter table
  pf_public.pf_grid_coordinates drop column cell;

alter table
  pf_public.pf_grid_coordinates
add
  column cell geography(Polygon, 4326) generated always as (
    -- RCM and GCM datasets have different grids
    case
      when grid = 'RCM' then ST_MakeEnvelope(
        ((ST_X(point :: geometry)) - 0.09999999660721),
        ((ST_Y(point :: geometry)) + 0.099999999999991),
        ((ST_X(point :: geometry)) + 0.09999999660721),
        ((ST_Y(point :: geometry)) - 0.099999999999991),
        4326
      ) :: geography
      when grid = 'GCM' then ST_MakeEnvelope(
        ((ST_X(point :: geometry)) - 0.75225225),
        ((ST_Y(point :: geometry)) + 0.75225225),
        ((ST_X(point :: geometry)) + 0.75225225),
        ((ST_Y(point :: geometry)) - 0.75225225),
        4326
      ) :: geography
    end
  ) stored;

create
or replace view pf_private.aggregate_pf_dataset_statistic_cells as
select
  coords.cell,
  stats.*
from
  pf_private.aggregate_pf_dataset_statistics stats
  join pf_public.pf_grid_coordinates coords on stats.coordinate_hash = coords.md5_hash;
