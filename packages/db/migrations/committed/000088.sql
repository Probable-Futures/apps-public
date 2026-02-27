--! Previous: sha1:d18769d5080f90a41cbfb8465df7cd277ab8585f
--! Hash: sha1:f9e9f418795c274925590b8a1504496bfbc30ed2

--! split: 1-current.sql
-- Enter migration here

-- Backfill null custom_email_discarded values and set a default so condition filtering works correctly
ALTER TABLE pf_private.pf_user_access_requests ALTER COLUMN custom_email_discarded SET DEFAULT false;
UPDATE pf_private.pf_user_access_requests SET custom_email_discarded = false WHERE custom_email_discarded IS NULL;
