--! Previous: sha1:e3b3eb5fdd2ee5dce523cafb122046074a5b2cf9
--! Hash: sha1:25ab349f1c1bae2650520755578b4fdd167d060e

--! split: 1-users-and-authentication.sql
grant usage on schema pf_public, pf_private to :AUTHENTICATED_ROLE;
grant select on all tables in schema pf_public to :AUTHENTICATED_ROLE;
grant usage, select on all sequences in schema pf_public to :AUTHENTICATED_ROLE;
grant execute on all functions in schema pf_public to :AUTHENTICATED_ROLE;

create table if not exists pf_private.pf_users (
  id uuid default gen_random_uuid() primary key,
  sub text unique not null,
  name text,
  email citext not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table pf_private.pf_users is
  E'A user who can log in to the application.';
comment on column pf_private.pf_users.sub is
  E'Unique OAuth Subject identifier for the user.';

grant select on pf_private.pf_users to :AUTHENTICATED_ROLE;
grant insert on pf_private.pf_users to :AUTHENTICATED_ROLE;
grant update on pf_private.pf_users to :AUTHENTICATED_ROLE;

alter table pf_private.pf_users enable row level security;

drop trigger if exists _100_timestamps on pf_private.pf_users cascade;
create trigger _100_timestamps
  before insert or update on pf_private.pf_users
  for each row
  execute procedure pf_private.tg__timestamps();

create or replace function pf_public.current_user_sub()
returns text as $$
  select nullif(pg_catalog.current_setting('pf_user.sub', true), '')::text;
$$ language sql stable;
comment on function pf_public.current_user_sub() is
  E'Handy method to get the current user sub id.';

grant execute on function pf_public.current_user_sub() to :AUTHENTICATED_ROLE;

create or replace function pf_public.current_user_id()
returns uuid as $$
  select id from pf_private.pf_users where sub = pf_public.current_user_sub();
$$ language sql stable;

drop policy if exists update_self
  on pf_private.pf_users;
create policy update_self
  on pf_private.pf_users for all
  using (sub = pf_public.current_user_sub())
  with check (sub = pf_public.current_user_sub());

create or replace function pf_private.upsert_user_and_log_last_active_at(
  sub text,
  email citext,
  name text
) returns pf_private.pf_users
  language plpgsql strict security definer
  as $$
  declare
    _user pf_private.pf_users;
  begin
    if not exists (select * from pf_private.pf_users
        where pf_private.pf_users.sub = upsert_user_and_log_last_active_at.sub)
      then
      insert into pf_private.pf_users
        (sub, email, name)
      values
        (upsert_user_and_log_last_active_at.sub,
         upsert_user_and_log_last_active_at.email,
         upsert_user_and_log_last_active_at.name);
    end if;
    update pf_private.pf_users set last_seen_at = now()
    where pf_private.pf_users.sub = upsert_user_and_log_last_active_at.sub
      and last_seen_at < now() - interval '5 minutes';
    select * from pf_private.pf_users
      where pf_private.pf_users.sub = upsert_user_and_log_last_active_at.sub
      into _user;
    return _user;
  end;
  $$;

alter function pf_private.upsert_user_and_log_last_active_at(sub text, email citext, name text) owner TO :DATABASE_OWNER;

create or replace function pf_public.authenticate_pf_user(
  email citext,
  name text
) returns pf_private.pf_users
  language sql volatile security definer
  as $$
  select pf_private.upsert_user_and_log_last_active_at(
    pf_public.current_user_sub(),
    email,
    name
  );
$$;

alter function pf_public.authenticate_pf_user(email citext, name text) owner TO :DATABASE_OWNER;
grant all on function pf_public.authenticate_pf_user(email citext, name text) to :AUTHENTICATED_ROLE;

create or replace function pf_public.current_user()
returns pf_private.pf_users
  language sql stable security definer
  AS $$
  select * from pf_private.pf_users
  where id = pf_public.current_user_id();
$$;

grant all on function pf_public.current_user() to :AUTHENTICATED_ROLE;

--! split: 2-enrichment-and-processing.sql
comment on table  pf_private.pf_partner_enrichment_statuses is
  E'@enum\n@enumName EnrichmentStatus';

grant all on pf_private.pf_partner_project_datasets to :AUTHENTICATED_ROLE;

-- We're storing the partner id to the row to simplify Row Level Security policies
alter table pf_private.pf_partner_projects
  add column if not exists partner_id uuid not null
    references pf_private.pf_users(id)
    on delete cascade;

create index if not exists idx_partner_projects_partner_id
  on pf_private.pf_partner_projects (partner_id);

alter table pf_private.pf_partner_datasets
  add column if not exists partner_id uuid not null
    references pf_private.pf_users(id)
    on delete cascade,
  add column if not exists upload_id uuid
    references pf_private.pf_partner_dataset_uploads(id)
    on delete cascade;

create index if not exists idx_partner_dataset_partner_id
  on pf_private.pf_partner_datasets (partner_id);
create index if not exists idx_partner_dataset_upload_id
  on pf_private.pf_partner_datasets (upload_id);

alter table pf_private.pf_partner_dataset_coordinates
  add column  if not exists gcm_pf_coordinate_id uuid
    references pf_public.pf_grid_coordinates(id)
    on update cascade,
  add column  if not exists rcm_pf_coordinate_id uuid
    references pf_public.pf_grid_coordinates(id)
    on update cascade;

alter table pf_private.pf_partner_dataset_enrichments
  add column if not exists partner_id uuid not null
    references pf_private.pf_users(id)
    on delete cascade,
  add column if not exists upload_id uuid
    references pf_private.pf_partner_dataset_uploads(id)
    on delete cascade,
  add column if not exists project_id uuid
    references pf_private.pf_partner_projects(id)
    on delete cascade,
  add column if not exists enriched_row_count integer,
  add column if not exists enrichment_errors jsonb,
  add column if not exists enrichment_time_ms integer,
  add column if not exists enriched_file_name text;

create index if not exists idx_partner_enrichments_partner_id
  on pf_private.pf_partner_dataset_enrichments (partner_id);
create index if not exists idx_partner_enrichments_upload_id
  on pf_private.pf_partner_dataset_enrichments (upload_id);
create index if not exists idx_partner_enrichments_project_id
  on pf_private.pf_partner_dataset_enrichments (project_id);


DO
$$
  BEGIN
    alter table pf_private.pf_partner_dataset_uploads
      rename column pre_processed_file to processed_file;
  EXCEPTION
    when undefined_column then
    end;
$$;

alter table pf_private.pf_partner_dataset_uploads
  add column if not exists partner_id uuid not null
    references pf_private.pf_users(id)
  on delete cascade,
  add column if not exists csv_headers text[],
  add column if not exists processed_row_count integer,
  add column if not exists processing_errors jsonb,
  add column if not exists processing_time_ms integer,
  add column if not exists processed_with_coordinates_file text,
  add column if not exists processed_with_coordinates_row_count integer,
  add column if not exists processing_with_coordinates_errors jsonb,
  add column if not exists processing_with_coordinates_time_ms integer;

create index if not exists idx_partner_dataset_uploads_partner_id
  on pf_private.pf_partner_dataset_uploads (partner_id);

-- Views
drop view if exists pf_public.view_partner_dataset_enrichments;
create or replace view pf_public.view_partner_dataset_enrichments as
  select
    id,
    status,
    upload_id,
    enrichment_errors,
    enrichment_time_ms
    enriched_row_count,
    enriched_dataset_file,
    enriched_file_name,
    project_id,
    pf_dataset_id
 from pf_private.pf_partner_dataset_enrichments
 where partner_id = (pf_public.current_user()).id;

 comment on view pf_public.view_partner_dataset_enrichments
   is E'@primaryKey id\n@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)\n';
 comment on column pf_public.view_partner_dataset_enrichments.status
   is E'@notNull';

-- Helper view to simplify querying partner's projects
drop view if exists pf_public.view_partner_projects;
create or replace view pf_public.view_partner_projects as
  select id,
    name,
    description,
    created_at,
    updated_at
from pf_private.pf_partner_projects
where partner_id = (pf_public.current_user()).id;

comment on view pf_public.view_partner_projects
  is E'@primaryKey id';
comment on column pf_public.view_partner_projects.name
  is E'@notNull';
comment on column pf_public.view_partner_projects.created_at
  is E'@notNull';

drop view if exists pf_public.view_partner_datasets;
create or replace view pf_public.view_partner_datasets
  as select
    pd.id,
    pd.name,
    pd.description,
    pd.upload_id,
    pd.created_at,
    pd.updated_at,
    pdu.original_file
  from pf_private.pf_partner_datasets pd
    join pf_private.pf_partner_dataset_uploads pdu
      on pd.id = pdu.partner_dataset_id
  where pd.partner_id = (pf_public.current_user()).id;
comment on view pf_public.view_partner_datasets
  is E'@primaryKey id\n@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)';
comment on column pf_public.view_partner_datasets.name
  is E'@notNull';

drop view if exists pf_public.view_partner_project_datasets;
create or replace view pf_public.view_partner_project_datasets
  as select
    pp.id as project_id,
    pp.name as project_name,
    pp.description as project_description,
    pd.id as dataset_id,
    pd.name as dataset_name,
    pd.description as dataset_description,
    pd.upload_id as upload_id,
    pdu.original_file as original_file,
    pde.enriched_dataset_file as enriched_dataset_file,
    pde.pf_dataset_id as pf_dataset_id,
    pde.enriched_file_name as enriched_file_name
  from pf_private.pf_partner_project_datasets ppd
    join pf_private.pf_partner_projects pp
      on pp.id = ppd.project_id
    join pf_private.pf_partner_datasets pd
      on pd.id = ppd.dataset_id
    join pf_private.pf_partner_dataset_uploads pdu
      on pd.upload_id = pdu.id
    left join pf_private.pf_partner_dataset_enrichments pde
      on pde.upload_id = pdu.id
  where pp.partner_id = (pf_public.current_user()).id
  and pd.partner_id = (pf_public.current_user()).id;

comment on view pf_public.view_partner_project_datasets
  is E'@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)\n@foreignKey (project_id) references pf_private.pf_partner_projects (id)';
comment on column pf_public.view_partner_project_datasets.dataset_name
  is E'@notNull';
comment on column pf_public.view_partner_project_datasets.project_name
  is E'@notNull';

drop view if exists pf_public.view_partner_dataset_uploads;
create or replace view pf_public.view_partner_dataset_uploads as
  select id,
    partner_dataset_id,
    original_file,
    processed_file,
    csv_headers,
    processed_row_count,
    processing_errors,
    processing_time_ms,
    processed_with_coordinates_file,
    processed_with_coordinates_row_count,
    processing_with_coordinates_errors,
    processing_with_coordinates_time_ms
from pf_private.pf_partner_dataset_uploads
where partner_id = (pf_public.current_user()).id;
comment on view pf_public.view_partner_dataset_uploads
  is E'@primaryKey id\n@foreignKey (partner_dataset_id) references pf_private.pf_partner_datasets (id)';
comment on column pf_public.view_partner_dataset_uploads.original_file
  is E'@notNull';

comment on view pf_public.view_partner_dataset_uploads
  is E'@primaryKey id\n@foreignKey (partner_dataset_id) references pf_private.pf_partner_datasets (id)\n@foreignKey (partner_dataset_id) references pf_private.pf_partner_datasets (id)';

-- Grants
grant all on pf_private.pf_partner_datasets to :AUTHENTICATED_ROLE;
grant all on pf_private.pf_partner_projects to :AUTHENTICATED_ROLE;
grant all on pf_private.pf_partner_project_datasets to :AUTHENTICATED_ROLE;
grant all on pf_private.pf_partner_dataset_uploads to :AUTHENTICATED_ROLE;
grant all on pf_private.pf_partner_dataset_enrichments to :AUTHENTICATED_ROLE;

grant select on pf_public.view_partner_datasets to :AUTHENTICATED_ROLE;
grant select on pf_public.view_partner_projects to :AUTHENTICATED_ROLE;
grant select on pf_public.view_partner_dataset_uploads to :AUTHENTICATED_ROLE;
grant select on pf_public.view_partner_project_datasets to :AUTHENTICATED_ROLE;
grant select on pf_public.view_partner_dataset_enrichments to :AUTHENTICATED_ROLE;

-- RLS
alter table pf_private.pf_partner_projects enable row level security;
alter table pf_private.pf_partner_datasets enable row level security;
alter table pf_private.pf_partner_dataset_uploads enable row level security;
alter table pf_private.pf_partner_dataset_enrichments enable row level security;

-- Policies
drop policy if exists private_partner_projects
  on pf_private.pf_partner_projects;
create policy private_partner_projects
  on pf_private.pf_partner_projects
  for all
  to :AUTHENTICATED_ROLE
  using ( partner_id = (pf_public.current_user()).id)
  with check( partner_id = (pf_public.current_user()).id);

drop policy if exists private_partner_datasets
  on pf_private.pf_partner_datasets;
create policy private_partner_datasets
  on pf_private.pf_partner_datasets
  for all
  to :AUTHENTICATED_ROLE
  using (  (pf_public.current_user()).id = partner_id )
  with check(  partner_id = (pf_public.current_user()).id);

drop policy if exists private_partner_uploads
  on pf_private.pf_partner_dataset_uploads;
create policy private_partner_uploads
  on pf_private.pf_partner_dataset_uploads
  for all
  to :AUTHENTICATED_ROLE
  using ( (pf_public.current_user()).id = partner_id )
  with check( partner_id = (pf_public.current_user()).id);

drop policy if exists private_partner_dataset_enrichments
  on pf_private.pf_partner_dataset_enrichments;
create policy private_partner_dataset_enrichments
  on pf_private.pf_partner_dataset_enrichments
  for all
  to :AUTHENTICATED_ROLE
  using ( (pf_public.current_user()).id = partner_id )
  with check( partner_id = (pf_public.current_user()).id);

create or replace function pf_private.set_upload_id_for_dataset_enrichment()
  returns trigger as $$
begin
  NEW.upload_id = (select upload_id
      from pf_private.pf_partner_datasets
      where id = NEW.partner_dataset_id
    );
  return NEW;
end;
$$ language plpgsql volatile;
comment on function pf_private.set_upload_id_for_dataset_enrichment() is
  E'Trigger function to set upload_id for current partner dataset';

create or replace function pf_private.process_partner_dataset_upload()
  returns trigger AS $$
begin
  update pf_private.pf_partner_datasets set upload_id = NEW.id where id = NEW.partner_dataset_id;
  PERFORM graphile_worker.add_job('process_partner_dataset',
    payload := json_build_object(
    'id', (NEW.id),
    'partnerId', (NEW.partner_id),
    'originalFile', (NEW.original_file),
    'partnerDatasetId', (NEW.partner_dataset_id)),
    max_attempts := 1);
  return new;
end;
$$ language plpgsql volatile security definer;

create or replace function pf_private.enrich_partner_dataset()
  returns trigger as $$
begin
  perform graphile_worker.add_job('enrich_partner_dataset',
    payload := json_build_object(
    'id', (NEW.id),
    'partnerId', (NEW.partner_id),
    'pfDatasetId', (NEW.pf_dataset_id),
    'uploadId', (NEW.upload_id),
    'partnerDatasetId', (NEW.partner_dataset_id)),
    max_attempts := 1);
  return new;
end;
$$ language plpgsql volatile security definer;

drop trigger if exists _500_upload on pf_private.pf_partner_dataset_uploads cascade;
create trigger _500_upload
  after insert on pf_private.pf_partner_dataset_uploads
  for each row
  execute procedure pf_private.process_partner_dataset_upload();

drop trigger if exists _500_upload on pf_private.pf_partner_dataset_enrichments cascade;
create trigger _500_upload
  after insert on pf_private.pf_partner_dataset_enrichments
  for each row
  execute procedure pf_private.enrich_partner_dataset();

create index if not exists rcm_coordinate_id_idx on pf_private.pf_partner_dataset_coordinates (rcm_pf_coordinate_id);
create index if not exists gcm_coordinate_id_idx on pf_private.pf_partner_dataset_coordinates (gcm_pf_coordinate_id);
create index if not exists pf_dataset_id_idx on pf_private.pf_partner_dataset_enrichments (pf_dataset_id);
create index if not exists partner_dataset_id_idx on pf_private.pf_partner_dataset_coordinates (partner_dataset_id);
create index if not exists pf_stats_coords_dataset on pf_public.pf_dataset_statistics (coordinate_id, dataset_id);

--! split: 3-crud-functions.sql
create or replace function pf_public.create_partner_project(
  name text,
  description text
) returns pf_private.pf_partner_projects
  language sql volatile security invoker
  AS $$
  insert into pf_private.pf_partner_projects
    (name, description, partner_id)
  values
    (name, description, (pf_public.current_user()).id)
  returning *;
$$;

create or replace function pf_public.create_partner_dataset(
  name text,
  description text
) returns pf_private.pf_partner_datasets
  language sql volatile security invoker
  AS $$
  insert into pf_private.pf_partner_datasets
    (name, description, partner_id)
  values
    (name, description, (pf_public.current_user()).id)
  returning *;
$$;

create or replace function pf_public.associate_partner_project_and_dataset(
  project_id uuid,
  dataset_id uuid
) returns pf_private.pf_partner_project_datasets
  language sql volatile security invoker
  as $$
  insert into pf_private.pf_partner_project_datasets
    (project_id, dataset_id)
  values
    (project_id, dataset_id)
  returning *;
$$;

create or replace function pf_public.create_partner_dataset_upload(
  file_url text,
  dataset_id uuid
) returns pf_private.pf_partner_dataset_uploads
language sql volatile security invoker
as $$
    insert into pf_private.pf_partner_dataset_uploads
      (original_file, partner_dataset_id, partner_id)
    values
      (file_url, dataset_id, (pf_public.current_user()).id)
    returning *
$$;

create or replace function pf_public.create_partner_dataset_enrichment(
  pf_dataset_id integer,
  partner_dataset_id uuid,
  upload_id uuid,
  project_id uuid,
  enriched_file_name text
) returns pf_private.pf_partner_dataset_enrichments
  language sql volatile security invoker
as $$
  insert into pf_private.pf_partner_dataset_enrichments
    (pf_dataset_id, partner_dataset_id, upload_id, project_id, enriched_file_name, partner_id)
  values
    (pf_dataset_id, partner_dataset_id, upload_id, project_id, enriched_file_name, (pf_public.current_user()).id)
  returning *;
$$;

-- delete
create or replace function pf_public.delete_partner_project(project_id uuid)
  returns boolean
  language plpgsql strict security definer
as $$
begin
  if not exists(select 1 from pf_private.pf_partner_projects where id = project_id)
    then raise exception 'project % not found', project_id;
  end if;
  delete from pf_private.pf_partner_datasets
    where id in
    (
      select d.id
        from  pf_private.pf_partner_datasets d
          inner join pf_private.pf_partner_project_datasets pd
            on d.id = pd.dataset_id
          inner join pf_private.pf_partner_projects p
            on p.id = pd.project_id
        where p.id = delete_partner_project.project_id
    );
  delete from pf_private.pf_partner_projects where id = project_id;
  return TRUE;
end;
$$;

create or replace function pf_public.delete_partner_dataset(dataset_id uuid)
  returns boolean
  language plpgsql strict security definer
as $$
begin
 if not exists(select 1 from pf_private.pf_partner_datasets where id = dataset_id)
    then raise exception 'dataset % not found', dataset_id;
  end if;
  delete from pf_private.pf_partner_datasets where id = dataset_id;
  return TRUE;
end;
$$;

grant all on function pf_public.create_partner_dataset(name text, description text) to :AUTHENTICATED_ROLE;
grant all on function pf_public.create_partner_project(name text, description text) to :AUTHENTICATED_ROLE;
grant all on function pf_public.associate_partner_project_and_dataset(project_id uuid, dataset_id uuid)
  to :AUTHENTICATED_ROLE;
grant all on function pf_public.create_partner_dataset_enrichment(pf_dataset_id integer, partner_dataset_id uuid, upload_id uuid, project_id uuid, enriched_file_name text)
  to :AUTHENTICATED_ROLE;
grant all on function pf_public.create_partner_dataset_upload(file_url text, dataset_id uuid)
  to :AUTHENTICATED_ROLE;
grant all on function pf_public.delete_partner_project(project_id uuid) to :AUTHENTICATED_ROLE;
grant all on function pf_public.delete_partner_dataset(dataset_id uuid) to :AUTHENTICATED_ROLE;
