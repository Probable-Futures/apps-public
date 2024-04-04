--! Previous: sha1:4b246e704e85d7386b3e5d5e0aff1c62a780d024
--! Hash: sha1:7b6c741cc6e05ef83804034e8004247ce420c386

--! split: 1-current.sql
-- Add unique constraint on the country name in pf_public.countries
ALTER TABLE pf_public.countries DROP CONSTRAINT IF EXISTS countries_name_unique;
ALTER TABLE pf_public.countries ADD CONSTRAINT countries_name_unique UNIQUE (name);
