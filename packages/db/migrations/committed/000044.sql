--! Previous: sha1:75b3340c7d97047c521ff7a01644a078d198d831
--! Hash: sha1:c97536d430e37fd784d4a4c0161885ee32b44ef4

--! split: 1-insert-admin-account.sql
insert into pf_private.pf_users (sub, name, email)
  values ('admin', 'admin', 'pf.admin@postlight.com')
on conflict
  do nothing;

--! split: 2-update-partner-dataset-views.sql
alter table pf_private.pf_partner_datasets
  add column if not exists is_example boolean default false;

drop view if exists pf_public.view_partner_datasets;

-- add is_example to the select statement and include rows having is_example = true
create or replace view pf_public.view_partner_datasets as
select
  pd.id,
  pd.name,
  pd.description,
  pd.created_at,
  pd.updated_at,
  pd.is_example,
  pdu.original_file,
  pdu.processed_with_coordinates_file,
  pdu.id as upload_id
from
  pf_private.pf_partner_datasets pd
  join pf_private.pf_partner_dataset_uploads pdu on pd.id = pdu.partner_dataset_id
where
  pd.partner_id = (pf_public."current_user" ()).id
  or pd.is_example = true;

comment on view pf_public.view_partner_datasets is '@primaryKey id
@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)';

comment on column pf_public.view_partner_datasets.name is '@notNull';

grant select on pf_public.view_partner_datasets to :AUTHENTICATED_ROLE;

drop view if exists pf_public.view_partner_dataset_uploads;

-- Return dataset_uploads whose datasets are sample datasets.
create view pf_public.view_partner_dataset_uploads as
select
  pdu.*
from
  pf_private.pf_partner_dataset_uploads pdu
  join pf_private.pf_partner_datasets pd on pd.id = pdu.partner_dataset_id
where
  pdu.partner_id = (pf_public."current_user" ()).id
  or pd.is_example = true;

comment on view pf_public.view_partner_dataset_uploads is '@primaryKey id
@foreignKey (partner_dataset_id) references pf_private.pf_partner_datasets (id)
@foreignKey (partner_dataset_id) references pf_private.pf_partner_datasets (id)';

comment on column pf_public.view_partner_dataset_uploads.original_file is '@notNull';

grant select on table pf_public.view_partner_dataset_uploads to :AUTHENTICATED_ROLE;

--! split: 3-function-to-add-sample-dataset.sql
create or replace function pf_public.add_partner_example_dataset (name text, description text, original_file text, geodata_type text)
  returns boolean
  language plpgsql
  strict
  security definer
  as $$
declare
  new_partner_dataset_id uuid;
  admin_id uuid;
begin
  select
    id into admin_id
  from
    pf_private.pf_users
  where
    sub = 'admin';
  insert into pf_private.pf_partner_datasets (name, description, partner_id, is_example)
    values (add_partner_example_dataset.name, add_partner_example_dataset.description, admin_id, true)
  returning
    id into new_partner_dataset_id;
  insert into pf_private.pf_partner_dataset_uploads (partner_dataset_id, original_file, partner_id, geodata_type, enrich)
    values (new_partner_dataset_id, add_partner_example_dataset.original_file, admin_id, add_partner_example_dataset.geodata_type, false);
  return true;
end;
$$;

comment on function pf_private.tg__timestamps () is E'This function should be called by an admin to add an example dataset after uploading it.';

grant all on function pf_public.add_partner_example_dataset to :ADMIN_ROLE;
