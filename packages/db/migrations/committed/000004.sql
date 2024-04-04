--! Previous: sha1:ded026231cdf4c149a43aa0bb31054d8c955aaaf
--! Hash: sha1:39356f9598e3cea6ed36f905a0b573317b8d00fa

--! split: 1-current.sql
alter table pf_public.pf_dataset_categories
add column parent_category citext;

update pf_public.pf_dataset_categories
set parent_category = 'heat';

create index if not exists pf_dataset_categories_parent_category_idx on pf_public.pf_dataset_categories (parent_category);
