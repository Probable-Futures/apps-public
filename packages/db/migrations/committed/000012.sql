--! Previous: sha1:e25c3866088c6807575e8a1f6680eb8b5a92ac32
--! Hash: sha1:6d00184c960d8ac026e3396458b8f4f9cbb39e11

--! split: 1-current.sql
-- TODO: Get Model Grid from Dataset and add to job payload
create or replace function pf_private.enrich_partner_dataset()
  returns trigger as $$
begin
  perform graphile_worker.add_job('enrich_partner_dataset',
    payload := json_build_object(
    'id', (NEW.id),
    'partnerId', (NEW.partner_id),
    'pfDatasetId', (NEW.pf_dataset_id),
    'uploadId', (NEW.upload_id),
    'partnerDatasetId', (NEW.partner_dataset_id)),
    max_attempts := 1);
  return new;
end;
$$ language plpgsql volatile security definer;


alter table pf_private.pf_partner_dataset_coordinates
  drop column if exists rcm_pf_coordinate_id cascade;

alter table pf_private.pf_partner_dataset_coordinates
  drop column if exists gcm_pf_coordinate_id cascade;

alter table pf_private.pf_partner_dataset_coordinates
  add column if not exists pf_rcm_coordinate_hash text references pf_public.pf_grid_coordinates(md5_hash)
    on update cascade,
  add column if not exists pf_gcm_coordinate_hash text references pf_public.pf_grid_coordinates(md5_hash)
    on update cascade;

alter table pf_public.pf_dataset_statistics
  drop column if exists coordinate_id cascade;

drop trigger if exists _200_set_coordinate_id
  on pf_public.pf_dataset_statistics cascade;

create or replace view pf_private.aggregate_pf_dataset_statistics as
  select coordinate_hash, dataset_id,
    unnest(array_agg(pctl10) filter (where warming_scenario = '0.5')) as data_baseline_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '0.5')) as data_baseline_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '0.5')) as data_baseline_pctl90,
    unnest(array_agg(pctl10) filter (where warming_scenario = '1.0')) as data_1c_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '1.0')) as data_1c_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '1.0')) as data_1c_pctl90,
    unnest(array_agg(pctl10) filter (where warming_scenario = '1.5')) as data_1_5c_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '1.5')) as data_1_5c_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '1.5')) as data_1_5c_pctl90,
    unnest(array_agg(pctl10) filter (where warming_scenario = '2.0')) as data_2c_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '2.0')) as data_2c_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '2.0')) as data_2c_pctl90,
    unnest(array_agg(pctl10) filter (where warming_scenario = '2.5')) as data_2_5c_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '2.5')) as data_2_5c_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '2.5')) as data_2_5c_pctl90,
    unnest(array_agg(pctl10) filter (where warming_scenario = '3.0')) as data_3c_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '3.0')) as data_3c_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '3.0')) as data_3c_pctl90
  from pf_public.pf_dataset_statistics
  group by coordinate_hash, dataset_id;

create or replace view pf_private.aggregate_pf_dataset_statistic_cells as
  select coords.cell, stats.*
  from pf_private.aggregate_pf_dataset_statistics stats
  join pf_public.pf_grid_coordinates coords
  on stats.coordinate_hash = coords.md5_hash;
