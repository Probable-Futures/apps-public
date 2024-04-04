--! Previous: sha1:100b7e309c18fe4cf1f8df16eabed34dd8a20467
--! Hash: sha1:59687e59565abf15a0437d4560c173a785403e27

--! split: 1-current.sql
-- Enter migration here
update
  pf_public.pf_dataset_parent_categories
set
  label = 'Maps of dryness'
where
  name = 'drought';
