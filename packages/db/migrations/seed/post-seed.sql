alter table pf_public.pf_grid_coordinates enable trigger _100_timestamps;
alter table pf_public.pf_dataset_statistics enable trigger _100_timestamps;

create index if not exists pf_grid_coordinate_point_idx
  on pf_public.pf_grid_coordinates
  using gist (point);
comment on index pf_grid_coordinate_point_idx is
  E'This GiST index is necessary for speeding up spatial queries';

create index if not exists pf_grid_coordinate_point_hash_idx
  on pf_public.pf_grid_coordinates
  using hash (md5_hash);

create index if not exists pf_grid_coordinate_grid_idx
  on pf_public.pf_grid_coordinates (grid);

create index if not exists pf_dataset_stats_dataset_idx
  on pf_public.pf_dataset_statistics (dataset_id);

create index if not exists pf_dataset_stats_coordinate_hash_idx
  on pf_public.pf_dataset_statistics
  using hash(coordinate_hash);

create index if not exists pf_dataset_stats_warming_idx
  on pf_public.pf_dataset_statistics (warming_scenario);
