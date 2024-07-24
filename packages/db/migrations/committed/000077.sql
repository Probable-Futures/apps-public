--! Previous: sha1:9c5680210a9f23c173a1660849b83b442ff4f3b7
--! Hash: sha1:9fa601a3e86be8c51a4450788744c59b5e6cac2c

--! split: 1-current.sql
alter table pf_public.geo_places add column if not exists properties jsonb;
