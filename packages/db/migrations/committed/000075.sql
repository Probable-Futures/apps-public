--! Previous: sha1:35ddbbea920d31478a069d16f8e92e353a406b08
--! Hash: sha1:8993e2dfc5339a00cb85779d374fba1c5d766e65

--! split: 1-current.sql
alter table pf_private.pf_user_access_requests add column if not exists closing text;

drop function if exists pf_public.pf_update_user_access_request;

create or replace function pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, closing text, rejected boolean)
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
    note,
    closing
  from
    pf_private.pf_user_access_requests;

grant select on pf_public.view_user_access_request to :ADMIN_ROLE;

grant all on function pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, closing text, rejected boolean) to :ADMIN_ROLE;
