--! Previous: sha1:e0b93d95ee2997747a13e44343569ae2ef08efc4
--! Hash: sha1:482e9298e52a7df20ad20e3bf49cbf59eb04df93

--! split: 1-current.sql
drop view if exists pf_private.aggregate_pf_dataset_statistic_cells;

drop view if exists pf_private.aggregate_pf_dataset_statistics;

alter table
  pf_public.pf_dataset_statistics
alter column
  pctl10 type numeric(6, 1);

alter table
  pf_public.pf_dataset_statistics
alter column
  mean type numeric(6, 1);

alter table
  pf_public.pf_dataset_statistics
alter column
  pctl90 type numeric(6, 1);

create
or replace view pf_private.aggregate_pf_dataset_statistics as
select
  coordinate_hash,
  dataset_id,
  unnest(
    array_agg(pctl10) filter (
      where
        warming_scenario = '0.5'
    )
  ) as data_baseline_pctl10,
  unnest(
    array_agg(mean) filter (
      where
        warming_scenario = '0.5'
    )
  ) as data_baseline_mean,
  unnest(
    array_agg(pctl90) filter (
      where
        warming_scenario = '0.5'
    )
  ) as data_baseline_pctl90,
  unnest(
    array_agg(pctl10) filter (
      where
        warming_scenario = '1.0'
    )
  ) as data_1c_pctl10,
  unnest(
    array_agg(mean) filter (
      where
        warming_scenario = '1.0'
    )
  ) as data_1c_mean,
  unnest(
    array_agg(pctl90) filter (
      where
        warming_scenario = '1.0'
    )
  ) as data_1c_pctl90,
  unnest(
    array_agg(pctl10) filter (
      where
        warming_scenario = '1.5'
    )
  ) as data_1_5c_pctl10,
  unnest(
    array_agg(mean) filter (
      where
        warming_scenario = '1.5'
    )
  ) as data_1_5c_mean,
  unnest(
    array_agg(pctl90) filter (
      where
        warming_scenario = '1.5'
    )
  ) as data_1_5c_pctl90,
  unnest(
    array_agg(pctl10) filter (
      where
        warming_scenario = '2.0'
    )
  ) as data_2c_pctl10,
  unnest(
    array_agg(mean) filter (
      where
        warming_scenario = '2.0'
    )
  ) as data_2c_mean,
  unnest(
    array_agg(pctl90) filter (
      where
        warming_scenario = '2.0'
    )
  ) as data_2c_pctl90,
  unnest(
    array_agg(pctl10) filter (
      where
        warming_scenario = '2.5'
    )
  ) as data_2_5c_pctl10,
  unnest(
    array_agg(mean) filter (
      where
        warming_scenario = '2.5'
    )
  ) as data_2_5c_mean,
  unnest(
    array_agg(pctl90) filter (
      where
        warming_scenario = '2.5'
    )
  ) as data_2_5c_pctl90,
  unnest(
    array_agg(pctl10) filter (
      where
        warming_scenario = '3.0'
    )
  ) as data_3c_pctl10,
  unnest(
    array_agg(mean) filter (
      where
        warming_scenario = '3.0'
    )
  ) as data_3c_mean,
  unnest(
    array_agg(pctl90) filter (
      where
        warming_scenario = '3.0'
    )
  ) as data_3c_pctl90
from
  pf_public.pf_dataset_statistics
group by
  coordinate_hash,
  dataset_id;

create
or replace view pf_private.aggregate_pf_dataset_statistic_cells as
select
  coords.cell,
  stats.*
from
  pf_private.aggregate_pf_dataset_statistics stats
  join pf_public.pf_grid_coordinates coords on stats.coordinate_hash = coords.md5_hash;
