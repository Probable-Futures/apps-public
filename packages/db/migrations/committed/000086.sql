--! Previous: sha1:6d7e45cf66c79526540d593b318c79de7261d632
--! Hash: sha1:920221ff7e1ac853c4ae637aa9eb94a7c39245a6

--! split: 1-current.sql
create or replace view pf_private.aggregate_pf_dataset_statistics_with_percentage as
select
  t.*,
  case when data_1c_mid = - 99999 then
    data_1c_mid
  else
    round((data_1c_mid / data_baseline_mid) * 100)
  end as data_1c_mid_percent,
  case when data_1_5c_mid = - 99999 then
    data_1_5c_mid
  else
    round((data_1_5c_mid / data_baseline_mid) * 100)
  end as data_1_5c_mid_percent,
  case when data_2c_mid = - 99999 then
    data_2c_mid
  else
    round((data_2c_mid / data_baseline_mid) * 100)
  end as data_2c_mid_percent,
  case when data_2_5c_mid = - 99999 then
    data_2_5c_mid
  else
    round((data_2_5c_mid / data_baseline_mid) * 100)
  end as data_2_5c_mid_percent,
  case when data_3c_mid = - 99999 then
    data_3c_mid
  else
    round((data_3c_mid / data_baseline_mid) * 100)
  end as data_3c_mid_percent
from (
  select
    coordinate_hash,
    dataset_id,
    unnest(array_agg(low_value) filter (where warming_scenario = '0.5')) as data_baseline_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '0.5')) as data_baseline_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '0.5')) as data_baseline_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '1.0')) as data_1c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '1.0')) as data_1c_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '1.0')) as data_1c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '1.5')) as data_1_5c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '1.5')) as data_1_5c_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '1.5')) as data_1_5c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '2.0')) as data_2c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '2.0')) as data_2c_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '2.0')) as data_2c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '2.5')) as data_2_5c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '2.5')) as data_2_5c_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '2.5')) as data_2_5c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '3.0')) as data_3c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '3.0')) as data_3c_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '3.0')) as data_3c_high
  from
    pf_public.pf_dataset_statistics
  group by
    coordinate_hash,
    dataset_id) t;

comment on view pf_private.aggregate_pf_dataset_statistics_with_percentage is E'View of aggregate dataset statistics across all warming scenarios';

create or replace view pf_private.aggregate_pf_dataset_statistic_cells_with_percentage as
select
  coords.cell,
  stats.*
from
  pf_private.aggregate_pf_dataset_statistics_with_percentage stats
  join pf_public.pf_grid_coordinates coords on stats.coordinate_hash = coords.md5_hash;

comment on view pf_private.aggregate_pf_dataset_statistic_cells_with_percentage is E'View of aggregate dataset statistics joined with coordinate cells';

create or replace view pf_private.aggregate_pf_dataset_statistics_with_absolute_values as
  select coordinate_hash, dataset_id,
    unnest(array_agg(low_value) filter (where warming_scenario = '0.5')) as data_baseline_absolute_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '0.5')) as data_baseline_absolute_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '0.5')) as data_baseline_absolute_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '1.0')) as data_1c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '1.0')) as data_1c_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '1.0')) as data_1c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '1.5')) as data_1_5c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '1.5')) as data_1_5c_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '1.5')) as data_1_5c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '2.0')) as data_2c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '2.0')) as data_2c_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '2.0')) as data_2c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '2.5')) as data_2_5c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '2.5')) as data_2_5c_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '2.5')) as data_2_5c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '3.0')) as data_3c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '3.0')) as data_3c_mid,
    unnest(array_agg(high_value) filter (where warming_scenario = '3.0')) as data_3c_high,
    unnest(array_agg(
      case
        when low_value is null then null
        when low_value in (-88888.0, -99999.0) then low_value
        else 0
      end) filter (where warming_scenario = '0.5')) as data_baseline_low,
    1.0 as data_baseline_mid, -- only for the frequency map other wise uncomment and use the code below
    -- unnest(array_agg(
    --   case
    --     when mid_value is null then null
    --     when mid_value in (-88888.0, -99999.0) then mid_value
    --     else 0
    --   end) filter (where warming_scenario = '0.5')) as data_baseline_mid,
    unnest(array_agg(
      case
        when high_value is null then null
        when high_value in (-88888.0, -99999.0) then high_value
        else 0
      end) filter (where warming_scenario = '0.5')) as data_baseline_high
  from pf_public.pf_dataset_statistics
  group by coordinate_hash, dataset_id;

comment on view pf_private.aggregate_pf_dataset_statistics_with_absolute_values is
  E'View of aggregate dataset statistics across all warming scenarios. Used to create change maps.';

create or replace view pf_private.aggregate_pf_dataset_statistic_cells_with_absolute_values as
select
  coords.cell,
  stats.*
from
  pf_private.aggregate_pf_dataset_statistics_with_absolute_values stats
  join pf_public.pf_grid_coordinates coords on stats.coordinate_hash = coords.md5_hash;

comment on view pf_private.aggregate_pf_dataset_statistic_cells_with_absolute_values is E'View of aggregate dataset statistics joined with coordinate cells. Used to create change maps';

CREATE OR REPLACE VIEW pf_private.aggregate_pf_statistics_change_to_absolute AS
SELECT
    dataset_id,
    coordinate_hash,
    MAX(CASE WHEN warming_scenario = '0.5' THEN low_value END) AS data_baseline_low,
    MAX(CASE WHEN warming_scenario = '0.5' THEN mid_value END) AS data_baseline_mid,
    MAX(CASE WHEN warming_scenario = '0.5' THEN high_value END) AS data_baseline_high,
    MAX(CASE WHEN warming_scenario = '0.5' THEN low_value END) +
    MAX(CASE WHEN warming_scenario = '1.0' THEN low_value END) AS data_1c_low,
    MAX(CASE WHEN warming_scenario = '0.5' THEN mid_value END) +
    MAX(CASE WHEN warming_scenario = '1.0' THEN mid_value END) AS data_1c_mid,
    MAX(CASE WHEN warming_scenario = '0.5' THEN high_value END) +
    MAX(CASE WHEN warming_scenario = '1.0' THEN high_value END) AS data_1c_high,
    MAX(CASE WHEN warming_scenario = '0.5' THEN low_value END) +
    MAX(CASE WHEN warming_scenario = '1.5' THEN low_value END) AS data_1_5c_low,
    MAX(CASE WHEN warming_scenario = '0.5' THEN mid_value END) +
    MAX(CASE WHEN warming_scenario = '1.5' THEN mid_value END) AS data_1_5c_mid,
    MAX(CASE WHEN warming_scenario = '0.5' THEN high_value END) +
    MAX(CASE WHEN warming_scenario = '1.5' THEN high_value END) AS data_1_5c_high,
    MAX(CASE WHEN warming_scenario = '0.5' THEN low_value END) +
    MAX(CASE WHEN warming_scenario = '2.0' THEN low_value END) AS data_2c_low,
    MAX(CASE WHEN warming_scenario = '0.5' THEN mid_value END) +
    MAX(CASE WHEN warming_scenario = '2.0' THEN mid_value END) AS data_2c_mid,
    MAX(CASE WHEN warming_scenario = '0.5' THEN high_value END) +
    MAX(CASE WHEN warming_scenario = '2.0' THEN high_value END) AS data_2c_high,
    MAX(CASE WHEN warming_scenario = '0.5' THEN low_value END) +
    MAX(CASE WHEN warming_scenario = '2.5' THEN low_value END) AS data_2_5c_low,
    MAX(CASE WHEN warming_scenario = '0.5' THEN mid_value END) +
    MAX(CASE WHEN warming_scenario = '2.5' THEN mid_value END) AS data_2_5c_mid,
    MAX(CASE WHEN warming_scenario = '0.5' THEN high_value END) +
    MAX(CASE WHEN warming_scenario = '2.5' THEN high_value END) AS data_2_5c_high,
    MAX(CASE WHEN warming_scenario = '0.5' THEN low_value END) +
    MAX(CASE WHEN warming_scenario = '3.0' THEN low_value END) AS data_3c_low,
    MAX(CASE WHEN warming_scenario = '0.5' THEN mid_value END) +
    MAX(CASE WHEN warming_scenario = '3.0' THEN mid_value END) AS data_3c_mid,
    MAX(CASE WHEN warming_scenario = '0.5' THEN high_value END) +
    MAX(CASE WHEN warming_scenario = '3.0' THEN high_value END) AS data_3c_high
FROM pf_public.pf_dataset_statistics
GROUP BY dataset_id, coordinate_hash;

comment on view pf_private.aggregate_pf_statistics_change_to_absolute is
  E'View of aggregate dataset statistics across all warming scenarios. Used to create change maps.';


create or replace view pf_private.aggregate_pf_statistic_cells_change_to_absolute as
select
  coords.cell,
  stats.*
from
  pf_private.aggregate_pf_statistics_change_to_absolute stats
  join pf_public.pf_grid_coordinates coords on stats.coordinate_hash = coords.md5_hash;

comment on view pf_private.aggregate_pf_statistic_cells_change_to_absolute is E'View of aggregate dataset statistics joined with coordinate cells. Used to create change maps';

create or replace view pf_private.aggregate_pf_dataset_statistics_with_mean as
  select coordinate_hash, dataset_id,
    unnest(array_agg(low_value) filter (where warming_scenario = '0.5')) as data_baseline_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '0.5')) as data_baseline_mid,
    unnest(array_agg(mean_value) filter (where warming_scenario = '0.5')) as data_baseline_mean,
    unnest(array_agg(high_value) filter (where warming_scenario = '0.5')) as data_baseline_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '1.0')) as data_1c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '1.0')) as data_1c_mid,
    unnest(array_agg(mean_value) filter (where warming_scenario = '1.0')) as data_1c_mean,
    unnest(array_agg(high_value) filter (where warming_scenario = '1.0')) as data_1c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '1.5')) as data_1_5c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '1.5')) as data_1_5c_mid,
    unnest(array_agg(mean_value) filter (where warming_scenario = '1.5')) as data_1_5c_mean,
    unnest(array_agg(high_value) filter (where warming_scenario = '1.5')) as data_1_5c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '2.0')) as data_2c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '2.0')) as data_2c_mid,
    unnest(array_agg(mean_value) filter (where warming_scenario = '2.0')) as data_2c_mean,
    unnest(array_agg(high_value) filter (where warming_scenario = '2.0')) as data_2c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '2.5')) as data_2_5c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '2.5')) as data_2_5c_mid,
    unnest(array_agg(mean_value) filter (where warming_scenario = '2.5')) as data_2_5c_mean,
    unnest(array_agg(high_value) filter (where warming_scenario = '2.5')) as data_2_5c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '3.0')) as data_3c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '3.0')) as data_3c_mid,
    unnest(array_agg(mean_value) filter (where warming_scenario = '3.0')) as data_3c_mean,
    unnest(array_agg(high_value) filter (where warming_scenario = '3.0')) as data_3c_high
  from pf_public.pf_dataset_statistics
  group by coordinate_hash, dataset_id;
comment on view pf_private.aggregate_pf_dataset_statistics_with_mean is
  E'View of aggregate dataset statistics across all warming scenarios';

create or replace view pf_private.aggregate_pf_dataset_statistic_cells_with_mean as
  select coords.cell, stats.*
  from pf_private.aggregate_pf_dataset_statistics_with_mean stats
  join pf_public.pf_grid_coordinates coords
  on stats.coordinate_hash = coords.md5_hash;
comment on view pf_private.aggregate_pf_dataset_statistic_cells_with_mean is
  E'View of aggregate dataset statistics joined with coordinate cells';


create or replace view pf_private.aggregate_pf_dataset_statistics_with_median as
  select coordinate_hash, dataset_id,
    unnest(array_agg(low_value) filter (where warming_scenario = '0.5')) as data_baseline_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '0.5')) as data_baseline_mid,
    unnest(array_agg(median_value) filter (where warming_scenario = '0.5')) as data_baseline_median,
    unnest(array_agg(high_value) filter (where warming_scenario = '0.5')) as data_baseline_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '1.0')) as data_1c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '1.0')) as data_1c_mid,
    unnest(array_agg(median_value) filter (where warming_scenario = '1.0')) as data_1c_median,
    unnest(array_agg(high_value) filter (where warming_scenario = '1.0')) as data_1c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '1.5')) as data_1_5c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '1.5')) as data_1_5c_mid,
    unnest(array_agg(median_value) filter (where warming_scenario = '1.5')) as data_1_5c_median,
    unnest(array_agg(high_value) filter (where warming_scenario = '1.5')) as data_1_5c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '2.0')) as data_2c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '2.0')) as data_2c_mid,
    unnest(array_agg(median_value) filter (where warming_scenario = '2.0')) as data_2c_median,
    unnest(array_agg(high_value) filter (where warming_scenario = '2.0')) as data_2c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '2.5')) as data_2_5c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '2.5')) as data_2_5c_mid,
    unnest(array_agg(median_value) filter (where warming_scenario = '2.5')) as data_2_5c_median,
    unnest(array_agg(high_value) filter (where warming_scenario = '2.5')) as data_2_5c_high,
    unnest(array_agg(low_value) filter (where warming_scenario = '3.0')) as data_3c_low,
    unnest(array_agg(mid_value) filter (where warming_scenario = '3.0')) as data_3c_mid,
    unnest(array_agg(median_value) filter (where warming_scenario = '3.0')) as data_3c_median,
    unnest(array_agg(high_value) filter (where warming_scenario = '3.0')) as data_3c_high
  from pf_public.pf_dataset_statistics
  group by coordinate_hash, dataset_id;
comment on view pf_private.aggregate_pf_dataset_statistics_with_median is
  E'View of aggregate dataset statistics across all warming scenarios';

create or replace view pf_private.aggregate_pf_dataset_statistic_cells_with_median as
  select coords.cell, stats.*
  from pf_private.aggregate_pf_dataset_statistics_with_median stats
  join pf_public.pf_grid_coordinates coords
  on stats.coordinate_hash = coords.md5_hash;
comment on view pf_private.aggregate_pf_dataset_statistic_cells_with_median is
  E'View of aggregate dataset statistics joined with coordinate cells';
