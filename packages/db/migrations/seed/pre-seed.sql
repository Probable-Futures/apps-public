drop index if exists pf_grid_coordinate_point_idx cascade;
drop index if exists pf_grid_coordinate_point_hash_idx cascade;
drop index if exists pf_grid_coordinate_grid_idx cascade;
drop index if exists pf_dataset_stats_dataset_idx cascade;
drop index if exists pf_dataset_stats_coordinate_hash_idx cascade;
drop index if exists pf_dataset_stats_warming_idx cascade;

alter table pf_public.pf_grid_coordinates disable trigger _100_timestamps;
alter table pf_public.pf_dataset_statistics disable trigger _100_timestamps;
