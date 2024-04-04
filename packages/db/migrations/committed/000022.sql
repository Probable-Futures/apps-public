--! Previous: sha1:26a00824dde319d7d7f632e3e4ac0c970e4eb343
--! Hash: sha1:940859ebdf33141603a823188827b16448c677fd

--! split: 1-current.sql
alter table
  pf_public.pf_maps
add
  column if not exists is_diff boolean default false;

alter table
  pf_public.pf_maps rename column bins to stops;

alter table
  pf_public.pf_datasets
add
  column if not exists max_value integer default 0;
