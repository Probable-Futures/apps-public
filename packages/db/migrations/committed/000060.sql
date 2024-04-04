--! Previous: sha1:5206a439f0645834f6e4e986bbb19ae69a275c8d
--! Hash: sha1:3811ea2f6133e361be4c712ac8f80220031d69de

--! split: 1-current.sql
alter table
  pf_public.pf_datasets
add
  column if not exists data_variables text[];

alter table
  pf_public.pf_maps
add
  column if not exists data_labels text[] default '{5th percentile,average,95th percentile}';

alter table
  pf_public.pf_maps
add
  column if not exists method_used_for_mid text default 'mean';

alter table pf_public.pf_datasets drop column if exists data_column_names;
