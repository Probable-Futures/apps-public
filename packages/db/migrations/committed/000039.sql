--! Previous: sha1:cbec4eab22de87b5ff686eec78f6c95eedabda3b
--! Hash: sha1:51773b3fa1100f0be128cef6c71ebbea1fb6717d

--! split: 1-current.sql
alter table pf_public.pf_maps
  alter column stops type real[];

alter table pf_public.pf_maps
  add column if not exists step real default 1;

alter table pf_public.pf_datasets
  alter column min_value type real;

alter table pf_public.pf_datasets
  alter column max_value type real;
