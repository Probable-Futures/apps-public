--! Previous: sha1:10d94f91e1d514af53e454969c04d352dd27427d
--! Hash: sha1:35ddbbea920d31478a069d16f8e92e353a406b08

--! split: 1-current.sql
create table if not exists pf_private.pf_user_access_requests (
  id uuid default gen_random_uuid () not null,
  form_name text not null,
  email text not null,
  form_fields jsonb not null,
  access_granted boolean default false,
  rejected boolean default false,
  note text,
  create_by_user_sub text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

drop trigger if exists _100_timestamps on pf_private.pf_user_access_requests cascade;

create trigger _100_timestamps
  before insert or update on pf_private.pf_user_access_requests for each row
  execute function pf_private.tg__timestamps ();

drop function if exists pf_public.create_user_access_request;

create or replace function pf_public.create_user_access_request(form_name text, email text, form_fields jsonb) 
returns uuid
as $$
declare
    new_id uuid;
begin
    insert into pf_private.pf_user_access_requests (form_name, email, form_fields, create_by_user_sub)
        values (form_name, email, form_fields, pf_public.current_user_sub())
    returning id into new_id;
    return new_id;
end;
$$
language 'plpgsql';

create or replace function pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, rejected boolean)
  returns boolean
  language plpgsql
  strict
  security definer
  as $$
begin
  if not exists (select 1 from pf_private.pf_user_access_requests where pf_private.pf_user_access_requests.id = pf_update_user_access_request.id) then
    raise exception 'user % not found', pf_update_user_access_request.id;
  end if;
  update pf_private.pf_user_access_requests 
    set access_granted = pf_update_user_access_request.access_granted, note = pf_update_user_access_request.note,
      rejected = pf_update_user_access_request.rejected
        where pf_private.pf_user_access_requests.id = pf_update_user_access_request.id;
  return true;
end;
$$;

drop view if exists pf_public.view_user_access_request;

create or replace view pf_public.view_user_access_request as
  select
    id,
    form_name,
    email,
    form_fields,
    access_granted,
    rejected,
    note
  from
    pf_private.pf_user_access_requests;

grant select on pf_public.view_user_access_request to :ADMIN_ROLE;

grant all on function pf_public.create_user_access_request (form_name text, email text, form_fields jsonb) to :ADMIN_ROLE;

grant insert, delete, update, select on table pf_private.pf_user_access_requests to :ADMIN_ROLE;

grant all on function pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, rejected boolean) to :ADMIN_ROLE;
