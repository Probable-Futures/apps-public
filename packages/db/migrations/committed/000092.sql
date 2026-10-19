--! Previous: sha1:81494a68f5af03d540920af580f019190935ffbd
--! Hash: sha1:50a26623820306ae2174df95611606ffc9d00b9d

--! split: 1-current.sql
-- The __500_pf_audit_table_delete_old_rows trigger runs
-- `delete ... where created_at < now() - interval '180 days'` after every
-- audit insert. With no index on created_at, each insert seq-scans the whole
-- table, so getDatasetStatistics latency grows with the audit log size.
-- The index turns that delete into a range scan over the expired rows only.
create index if not exists pf_audit_created_at_idx on pf_private.pf_audit (created_at);
