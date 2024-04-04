--! Previous: sha1:a5a9b9c29131298d526b765575c2fa771dcf709e
--! Hash: sha1:ac6520389ba3634a6152fb0343b5f9ca9cf786a3

--! split: 1-current.sql
alter table pf_public.pf_maps
  add column if not exists percentage_stops integer[];
