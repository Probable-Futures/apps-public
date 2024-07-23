--! Previous: sha1:8993e2dfc5339a00cb85779d374fba1c5d766e65
--! Hash: sha1:9c5680210a9f23c173a1660849b83b442ff4f3b7

--! split: 1-current.sql
-- rename tables
DO $$
begin
    if not exists (select 1 from pg_tables where tablename = 'geo_places') then
        execute 'alter table pf_public.countries rename to geo_places';
    end if;
end$$;

DO $$
begin
    if not exists (select 1 from pg_tables where tablename = 'pf_geo_place_statistics') then
        execute 'alter table pf_private.pf_country_statistics rename to pf_geo_place_statistics';
    end if;
end$$;

-- add new column
alter table pf_public.geo_places add column if not exists geo_place_type text;

-- rename indexes
DO $$
begin
    if exists (select from pg_class where relname = 'pf_countries_wkb_geometry_idx' and relkind = 'i') then
        alter index pf_countries_wkb_geometry_idx RENAME to geo_places_wkb_geometry_idx;
    end if;
end $$;

-- rename columns
-- DO $$
-- begin
--   if exists(select *
--     from information_schema.columns
--     where table_name='pf_private.pf_geo_place_statistics' and column_name='country_id')
--   then
--       alter table "pf_private"."pf_geo_place_statistics" rename column "country_id" to "geo_place_id";
--   end if;
-- end $$;
alter table pf_private.pf_geo_place_statistics rename column country_id to geo_place_id;

-- drop and recreate foreign key constraints with new names
alter table pf_private.pf_geo_place_statistics drop constraint if exists pf_country_statistics_countries_fkey;

alter table pf_private.pf_geo_place_statistics drop constraint if exists pf_country_statistics_pf_datastes_fkey;

alter table pf_private.pf_geo_place_statistics drop constraint if exists pf_geo_place_statistics_geo_places_fkey;

alter table pf_private.pf_geo_place_statistics drop constraint if exists pf_geo_place_statistics_pf_datasets_fkey;

alter table pf_public.geo_places drop constraint if exists countries_name_unique;

alter table pf_private.pf_geo_place_statistics add constraint pf_geo_place_statistics_geo_places_fkey foreign key (geo_place_id) references pf_public.geo_places(id);

alter table pf_private.pf_geo_place_statistics add constraint pf_geo_place_statistics_pf_datasets_fkey foreign key (dataset_id) references pf_public.pf_datasets(id);

-- recreate trigger
drop trigger if exists _500_create_statistics_file on pf_private.pf_geo_place_statistics cascade;

create or replace function pf_private.create_statistics_file() returns trigger
    language plpgsql security DEFINER
    AS $$
begin
  perform
    graphile_worker.add_job ('create_statistics_file', payload := json_build_object('id', (new.id), 'geoPlaceId', (new.geo_place_id), 'datasetId', (new.dataset_id)), max_attempts := 1);
  return new;
end;
$$;

create trigger _500_create_statistics_file before insert on pf_private.pf_geo_place_statistics for each row execute function pf_private.create_statistics_file();


-- recreate functions
drop function if exists pf_public.create_pf_country_statistics (country_id uuid, dataset_id int);
drop function if exists pf_public.create_pf_geo_place_statistics (geo_place_id uuid, dataset_id int);

create or replace function pf_public.create_pf_geo_place_statistics (geo_place_id uuid, dataset_id int)
  returns setof pf_private.pf_geo_place_statistics
  language plpgsql security DEFINER
  as $$
  declare 
    geo_place_statistics pf_private.pf_geo_place_statistics;
  begin
  select * into geo_place_statistics 
  from pf_private.pf_geo_place_statistics cs 
  where cs.geo_place_id = create_pf_geo_place_statistics.geo_place_id 
  and cs.dataset_id = create_pf_geo_place_statistics.dataset_id
  and cs.status = 'successful';
  if geo_place_statistics is null then
    insert into pf_private.pf_geo_place_statistics (geo_place_id, dataset_id)
      values (create_pf_geo_place_statistics.geo_place_id, create_pf_geo_place_statistics.dataset_id) 
        returning * into geo_place_statistics;
  end if;
  return next geo_place_statistics;
  end;
$$;

grant all on function pf_public.create_pf_geo_place_statistics (geo_place_id uuid, dataset_id int) to :AUTHENTICATED_ROLE;

-- recreate views
drop view if exists pf_public.view_pf_country_statistics;
drop view if exists pf_public.view_pf_geo_place_statistics;

create or replace view pf_public.view_pf_geo_place_statistics as
  select
    id,
    dataset_id,
    geo_place_id,
    file_url,
    status
  from
    pf_private.pf_geo_place_statistics;

grant select on pf_public.view_pf_geo_place_statistics to :AUTHENTICATED_ROLE;
