--! Previous: sha1:7f4250fdb33c4f38096f8cd6d4e6203dd53d9980
--! Hash: sha1:cbec4eab22de87b5ff686eec78f6c95eedabda3b

--! split: 1-current.sql
update
  pf_public.pf_dataset_parent_categories
set
  label = 'Maps of temperature'
where
  name = 'heat';

update
  pf_public.pf_dataset_parent_categories
set
  label = 'Maps of precipitation'
where
  name = 'water';

update
  pf_public.pf_dataset_parent_categories
set
  label = 'Maps of drought'
where
  name = 'drought';

update
  pf_public.pf_dataset_parent_categories
set
  label = 'Other maps'
where
  name = 'classification';
