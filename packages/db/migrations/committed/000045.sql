--! Previous: sha1:c97536d430e37fd784d4a4c0161885ee32b44ef4
--! Hash: sha1:723e1c4cf52c211ec42d3ab377d3a7f1b1cd245c

--! split: 1-current.sql
create table if not exists pf_private.pf_audit (
  id uuid default gen_random_uuid () not null,
  action_type text,
  payload jsonb,
  user_sub text,
  user_ip text,
  rate_limit_threshold integer,
  message text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

drop trigger if exists _100_timestamps on pf_private.pf_audit cascade;

create trigger _100_timestamps
  before insert or update on pf_private.pf_audit for each row
  execute function pf_private.tg__timestamps ();

drop function if exists pf_public.create_audit;

create or replace function pf_public.create_audit (action_type text, payload jsonb, user_ip text, message text, rate_limit_threshold integer)
  returns void
  as $$
begin
  insert into pf_private.pf_audit (message, action_type, user_sub, user_ip, payload, rate_limit_threshold)
    values (message, action_type, pf_public.current_user_sub (), user_ip, payload, rate_limit_threshold);
end;
$$
language 'plpgsql';

drop function if exists pf_public.pf_audit_table_delete_old_rows cascade;

create function pf_public.pf_audit_table_delete_old_rows ()
  returns trigger
  language plpgsql
  as $$
begin
  delete from pf_private.pf_audit
  where created_at < NOW() - INTERVAL '90 days';
  return null;
end;
$$;

create trigger __500_pf_audit_table_delete_old_rows
  after insert on pf_private.pf_audit for each row
  execute procedure pf_public.pf_audit_table_delete_old_rows ();

grant all on function pf_public.create_audit (action_type text, payload jsonb, user_ip text, message text, rate_limit_threshold integer) to :PARTNER_ROLE;

grant all on function pf_public.pf_audit_table_delete_old_rows to :PARTNER_ROLE;

grant USAGE on schema pf_private to :PARTNER_ROLE;

grant insert, delete, update, select on table pf_private.pf_audit to :PARTNER_ROLE;

grant all on function pf_public.current_user_sub () to :PARTNER_ROLE;
