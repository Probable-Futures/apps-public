--! Previous: sha1:529a85f8a013803a4af091d8d97948d37c53f5c9
--! Hash: sha1:fd5dfb8e95dcdea8c30c0354d7cd9fd6d96ad92f

--! split: 1-current.sql
-- Enter migration here
alter table
  pf_public.pf_datasets
add
  column if not exists data_column_names text [3] default '{10th percentile,average,90th percentile}';
