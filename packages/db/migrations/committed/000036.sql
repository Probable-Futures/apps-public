--! Previous: sha1:85110fcd8f38a554f55ba3b1cc584babe6c366e7
--! Hash: sha1:bf872a3fedd7865fcbd193c895d3fa91613ea8cf

--! split: 1-current.sql
-- update attributes in aggragation views

drop view if exists pf_private.aggregate_pf_dataset_statistic_cells;

drop view if exists pf_private.aggregate_pf_dataset_statistics;

create view pf_private.aggregate_pf_dataset_statistics as
select
  pf_dataset_statistics.coordinate_hash,
  pf_dataset_statistics.dataset_id,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '0.5'::text))) as data_baseline_low,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '0.5'::text))) as data_baseline_mid,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '0.5'::text))) as data_baseline_high,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '1.0'::text))) as data_1c_low,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '1.0'::text))) as data_1c_mid,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '1.0'::text))) as data_1c_high,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '1.5'::text))) as data_1_5c_low,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '1.5'::text))) as data_1_5c_mid,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '1.5'::text))) as data_1_5c_high,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '2.0'::text))) as data_2c_low,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '2.0'::text))) as data_2c_mid,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '2.0'::text))) as data_2c_high,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '2.5'::text))) as data_2_5c_low,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '2.5'::text))) as data_2_5c_mid,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '2.5'::text))) as data_2_5c_high,
  unnest(array_agg(pf_dataset_statistics.low_value) filter (where (pf_dataset_statistics.warming_scenario = '3.0'::text))) as data_3c_low,
  unnest(array_agg(pf_dataset_statistics.mid_value) filter (where (pf_dataset_statistics.warming_scenario = '3.0'::text))) as data_3c_mid,
  unnest(array_agg(pf_dataset_statistics.high_value) filter (where (pf_dataset_statistics.warming_scenario = '3.0'::text))) as data_3c_high
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
  stats.data_baseline_low,
  stats.data_baseline_mid,
  stats.data_baseline_high,
  stats.data_1c_low,
  stats.data_1c_mid,
  stats.data_1c_high,
  stats.data_1_5c_low,
  stats.data_1_5c_mid,
  stats.data_1_5c_high,
  stats.data_2c_low,
  stats.data_2c_mid,
  stats.data_2c_high,
  stats.data_2_5c_low,
  stats.data_2_5c_mid,
  stats.data_2_5c_high,
  stats.data_3c_low,
  stats.data_3c_mid,
  stats.data_3c_high
from (pf_private.aggregate_pf_dataset_statistics stats
  join pf_public.pf_grid_coordinates coords on ((stats.coordinate_hash = coords.md5_hash)));
