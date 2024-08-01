--! Previous: sha1:e7139334303d6c8dab13497175b116713607be94
--! Hash: sha1:0f4d6b793078c83723e2e9fe50625365b1374fa9

--! split: 1-current.sql
drop function if exists pf_public.pf_update_user_access_request;

create or replace function pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, closing text, rejected boolean, final_email text)
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
