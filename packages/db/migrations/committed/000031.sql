--! Previous: sha1:aea5e211555fa9f5d5aaa0889b77bd49b5537aca
--! Hash: sha1:a5a9b9c29131298d526b765575c2fa771dcf709e

--! split: 1-current.sql
alter table pf_public.pf_dataset_statistics rename column pctl10 to low_value;

alter table pf_public.pf_dataset_statistics rename column mean to mid_value;

alter table pf_public.pf_dataset_statistics rename column pctl90 to high_value;

drop view if exists pf_private.aggregate_pf_dataset_statistic_cells;

drop view if exists pf_private.aggregate_pf_dataset_statistics;

create view pf_private.aggregate_pf_dataset_statistics as
select
  pf_dataset_statistics.coordinate_hash,
  pf_dataset_statistics.dataset_id,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '0.5'::text))) as data_baseline_pctl10,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '0.5'::text))) as data_baseline_mean,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '0.5'::text))) as data_baseline_pctl90,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '1.0'::text))) as data_1c_pctl10,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '1.0'::text))) as data_1c_mean,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '1.0'::text))) as data_1c_pctl90,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '1.5'::text))) as data_1_5c_pctl10,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '1.5'::text))) as data_1_5c_mean,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '1.5'::text))) as data_1_5c_pctl90,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '2.0'::text))) as data_2c_pctl10,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '2.0'::text))) as data_2c_mean,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '2.0'::text))) as data_2c_pctl90,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '2.5'::text))) as data_2_5c_pctl10,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '2.5'::text))) as data_2_5c_mean,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '2.5'::text))) as data_2_5c_pctl90,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '3.0'::text))) as data_3c_pctl10,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '3.0'::text))) as data_3c_mean,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '3.0'::text))) as data_3c_pctl90
from
  pf_public.pf_dataset_statistics
group by
  pf_dataset_statistics.coordinate_hash,
  pf_dataset_statistics.dataset_id;

create view pf_private.aggregate_pf_dataset_statistic_cells as
select
  coords.cell,
  stats.coordinate_hash,
  stats.dataset_id,
  stats.data_baseline_pctl10,
  stats.data_baseline_mean,
  stats.data_baseline_pctl90,
  stats.data_1c_pctl10,
  stats.data_1c_mean,
  stats.data_1c_pctl90,
  stats.data_1_5c_pctl10,
  stats.data_1_5c_mean,
  stats.data_1_5c_pctl90,
  stats.data_2c_pctl10,
  stats.data_2c_mean,
  stats.data_2c_pctl90,
  stats.data_2_5c_pctl10,
  stats.data_2_5c_mean,
  stats.data_2_5c_pctl90,
  stats.data_3c_pctl10,
  stats.data_3c_mean,
  stats.data_3c_pctl90
from (pf_private.aggregate_pf_dataset_statistics stats
  join pf_public.pf_grid_coordinates coords on ((stats.coordinate_hash = coords.md5_hash)));
