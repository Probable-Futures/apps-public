--! Previous: sha1:39356f9598e3cea6ed36f905a0b573317b8d00fa
--! Hash: sha1:e3b3eb5fdd2ee5dce523cafb122046074a5b2cf9

--! split: 1-current.sql
drop index pf_dataset_categories_parent_category_idx;

create index pf_dataset_categories_parent_category_idx on pf_public.pf_dataset_categories (parent_category);
