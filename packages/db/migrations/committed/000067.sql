--! Previous: sha1:7b6c741cc6e05ef83804034e8004247ce420c386
--! Hash: sha1:7c936aa17c1cd406a58962341aa5a4b2a3ecc0a2

--! split: 1-current.sql
insert into pf_public.pf_dataset_units (unit, unit_long)
  values ('nights', 'Number of nights per year')
on conflict
  do nothing;
