--! Previous: sha1:72b4477a04498501609345403116f1aa10fbfe54
--! Hash: sha1:fbfb42fafa9fcbb5bd0cca1902cef8e92f0be9e8

--! split: 1-current.sql
alter table pf_private.pf_user_access_requests add column if not exists custom_email text;
alter table pf_private.pf_user_access_requests add column if not exists custom_email_discarded boolean;


drop function if exists pf_public.pf_update_user_access_request;

create or replace function pf_public.pf_update_user_access_request(
  id uuid,
  access_granted boolean default null,
  note text default null,
  closing text default null,
  rejected boolean default null,
  final_email text default null,
  custom_email text default null,
  custom_email_discarded boolean default null
)
returns boolean
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from pf_private.pf_user_access_requests where pf_user_access_requests.id = pf_update_user_access_request.id) then
    raise exception 'User % not found', pf_update_user_access_request.id;
  end if;

  update pf_private.pf_user_access_requests
  set
    access_granted = case when pf_update_user_access_request.access_granted is not null then pf_update_user_access_request.access_granted else pf_user_access_requests.access_granted end,
    note = case when pf_update_user_access_request.note is not null then pf_update_user_access_request.note else pf_user_access_requests.note end,
    closing = case when pf_update_user_access_request.closing is not null then pf_update_user_access_request.closing else pf_user_access_requests.closing end,
    rejected = case when pf_update_user_access_request.rejected is not null then pf_update_user_access_request.rejected else pf_user_access_requests.rejected end,
    final_email = case when pf_update_user_access_request.final_email is not null then pf_update_user_access_request.final_email else pf_user_access_requests.final_email end,
    custom_email = case when pf_update_user_access_request.custom_email is not null then pf_update_user_access_request.custom_email else pf_user_access_requests.custom_email end,
    custom_email_discarded = case when pf_update_user_access_request.custom_email_discarded is not null then pf_update_user_access_request.custom_email_discarded else pf_user_access_requests.custom_email_discarded end
  where pf_user_access_requests.id = pf_update_user_access_request.id;

  return true;
end;
$$;

grant all on function pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, closing text, rejected boolean, final_email text, custom_email text, custom_email_discarded boolean) to :ADMIN_ROLE;

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
    final_email,
    custom_email,
    custom_email_discarded
  from
    pf_private.pf_user_access_requests;

grant select on pf_public.view_user_access_request to :ADMIN_ROLE;
