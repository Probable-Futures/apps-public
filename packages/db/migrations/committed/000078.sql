--! Previous: sha1:9fa601a3e86be8c51a4450788744c59b5e6cac2c
--! Hash: sha1:e7139334303d6c8dab13497175b116713607be94

--! split: 1-current.sql
alter table pf_private.pf_user_access_requests add column if not exists final_email text;

drop function if exists pf_public.pf_update_user_access_request;

create or replace function pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, closing text, rejected boolean, final_email text default null)
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
        closing = pf_update_user_access_request.closing,
        rejected = pf_update_user_access_request.rejected,
        final_email = pf_update_user_access_request.final_email
        where pf_private.pf_user_access_requests.id = pf_update_user_access_request.id;
  return true;
end;
$$;

grant all on function pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, closing text, rejected boolean, final_email text) to :ADMIN_ROLE;

drop view if exists pf_public.view_user_access_request;

create or replace view pf_public.view_user_access_request as
  select
    id,
    form_name,
    email,
    form_fields,
    access_granted,
    rejected,
    note,
    closing,
    final_email
  from
    pf_private.pf_user_access_requests;

grant select on pf_public.view_user_access_request to :ADMIN_ROLE;
