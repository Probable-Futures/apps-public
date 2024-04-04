--! Previous: sha1:2d7cd195b6779a5d72b5f81d5a1016e4d4628077
--! Hash: sha1:e0b93d95ee2997747a13e44343569ae2ef08efc4

--! split: 1-current.sql
update
  pf_public.pf_dataset_units
set
  unit_long = 'Change in precipitation (mm)'
where
  unit = 'mm';

insert into
  pf_public.pf_dataset_units (unit, unit_long)
values
  ('x as frequent', 'Times more/less frequent');
