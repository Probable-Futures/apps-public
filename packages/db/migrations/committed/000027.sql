--! Previous: sha1:ee3a8b7d11d28bfdde4484dfbac520f386724311
--! Hash: sha1:2d7cd195b6779a5d72b5f81d5a1016e4d4628077

--! split: 1-current.sql
create table if not exists pf_public.pf_dataset_parent_categories (name text primary key, label text);

create table if not exists pf_public.pf_dataset_sub_categories (
  name text primary key,
  parent_category citext not null,
  unique (name, parent_category),
  constraint pf_dataset_sub_categories_parent_category_fkey foreign key (parent_category) references pf_public.pf_dataset_parent_categories(name)
);

insert into
  pf_public.pf_dataset_parent_categories (name, label)
values
  ('heat', 'heat'),
  ('water', 'precipitation'),
  ('drought', 'soil');

insert into
  pf_public.pf_dataset_sub_categories (name, parent_category)
values
  ('increasing heat', 'heat'),
  ('decreasing cold', 'heat'),
  ('heat and humidity', 'heat');

alter table
  pf_public.pf_datasets
add
  column if not exists parent_category text,
add
  constraint pf_datasets_parent_category_fkey foreign key (parent_category) references pf_public.pf_dataset_parent_categories(name);

alter table
  pf_public.pf_datasets
add
  column if not exists sub_category text,
add
  constraint pf_datasets_sub_category_fkey foreign key (sub_category) references pf_public.pf_dataset_sub_categories(name);

grant
select
  on table pf_public.pf_dataset_parent_categories to :VISITOR_ROLE;

grant
select
  on table pf_public.pf_dataset_sub_categories to :VISITOR_ROLE;

grant
select
  on table pf_public.pf_dataset_parent_categories to :AUTHENTICATED_ROLE;

grant
select
  on table pf_public.pf_dataset_sub_categories to :AUTHENTICATED_ROLE;

alter table
  pf_public.pf_datasets drop column if exists category;

drop table if exists pf_public.pf_dataset_categories cascade;
