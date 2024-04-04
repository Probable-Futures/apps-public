--! Previous: sha1:8c68cf07521b105ff51a23b4385567d75a11b23d
--! Hash: sha1:49e180565f36d76ba300249d2cf0c5433d6c05b9

--! split: 1-current.sql
alter table
  pf_public.pf_datasets
add
  column if not exists min_value integer default 0;
