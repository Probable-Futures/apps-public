--! Previous: sha1:25ab349f1c1bae2650520755578b4fdd167d060e
--! Hash: sha1:91ed3f4a1c4bf15b66a29b0af7c86db9e74c405b

--! split: 1-current.sql
-- Enter migration here

alter table pf_private.pf_partner_projects
  add column if not exists map_config jsonb;

create or replace function pf_public.update_partner_project(
  map_config jsonb,
  project_id uuid
) returns pf_private.pf_partner_projects
  language sql volatile security invoker
  AS $$
  update pf_private.pf_partner_projects
    set map_config = update_partner_project.map_config where id = project_id
  returning *;
$$;

drop view if exists pf_public.view_partner_projects;
create or replace view pf_public.view_partner_projects as
  select id,
    name,
    description,
    map_config,
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

grant select on pf_public.view_partner_projects to :AUTHENTICATED_ROLE;
grant all on function pf_public.update_partner_project(map_config jsonb, project_id uuid) to :AUTHENTICATED_ROLE;

create table if not exists pf_private.pf_partner_project_shares (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references pf_private.pf_partner_projects
    on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 weeks'
);

grant insert,select on pf_private.pf_partner_project_shares to :AUTHENTICATED_ROLE;

drop trigger if exists _100_timestamps
  on pf_private.pf_partner_project_shares cascade;
create trigger _100_timestamps
  before insert or update on pf_private.pf_partner_project_shares
  for each row
  execute procedure pf_private.tg__timestamps();
