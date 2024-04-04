--! Previous: sha1:06ac6bb0266c4403fb760b6debbfd6c689d88c4b
--! Hash: sha1:100b7e309c18fe4cf1f8df16eabed34dd8a20467

--! split: 1-current.sql
alter table pf_public.pf_maps
  add column if not exists binning_type text default 'range'::text not null;

alter table pf_public.pf_maps
  add column if not exists bin_labels text[];
