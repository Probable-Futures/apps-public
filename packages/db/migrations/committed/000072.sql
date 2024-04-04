--! Previous: sha1:7248697fae613c60f989c35ed08a1a86200c2947
--! Hash: sha1:04c0b2f36f48b7c6655afcf3d02928d3a70b3c3b

--! split: 1-current.sql
create or replace function pf_public.pf_audit_table_delete_old_rows ()
  returns trigger
  language plpgsql
  as $$
begin
  delete from pf_private.pf_audit
  where created_at < NOW() - INTERVAL '180 days';
  return null;
end;
$$;
