--! Previous: sha1:59687e59565abf15a0437d4560c173a785403e27
--! Hash: sha1:75b3340c7d97047c521ff7a01644a078d198d831

--! split: 1-current.sql
-- Enter migration here
update
  pf_public.pf_dataset_parent_categories
set
  name = 'land'
where
  name = 'drought';

update
  pf_public.pf_dataset_parent_categories
set
  name = 'other'
where
  name = 'classification';

insert into pf_public.pf_dataset_units (unit, unit_long)
  values ('z-score', 'Change in water balance')
on conflict
  do nothing;

insert into pf_public.pf_dataset_units (unit, unit_long)
  values ('%', 'Annual likelihood (%)')
on conflict
  do nothing;

update
  pf_public.pf_dataset_units
set
  unit_long = 'Climate zone'
where
  unit = 'class';
