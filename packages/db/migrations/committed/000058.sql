--! Previous: sha1:dae7ccee0a39fd81827e6005acbdf8235b6fbed2
--! Hash: sha1:4e998ed926b22a4f6c986bd8811d42102d766bb9

--! split: 1-countries-related-tables.sql
create table if not exists pf_public.countries (
    id uuid default gen_random_uuid() not null primary key,
    name text not null,
    iso_a2 character varying,
    iso_a3 character varying,
    wkb_geometry geometry(MultiPolygon,4326) not null,
    created_at timestamp with time zone default now() NOT NULL,
    updated_at timestamp with time zone default now() NOT NULL
);

create index if not exists pf_countries_wkb_geometry_idx on pf_public.countries using GIST(wkb_geometry);

create table if not exists pf_private.pf_country_statistics (
  id uuid default gen_random_uuid() not null primary key,
  country_id uuid not null,
  dataset_id integer not null,
  file_url text,
  status text default 'requested'::text,
  created_at timestamp with time zone default now() NOT NULL,
  updated_at timestamp with time zone default now() NOT NULL,
  
  constraint pf_country_statistics_countries_fkey foreign key (country_id) references pf_public.countries(id),
  constraint pf_country_statistics_pf_datastes_fkey foreign key (dataset_id) references pf_public.pf_datasets(id)
);

drop trigger if exists _100_timestamps on pf_private.pf_country_statistics cascade;

create trigger _100_timestamps
  before insert or update on pf_private.pf_country_statistics for each row
  execute function pf_private.tg__timestamps ();

grant select on table pf_public.countries to :VISITOR_ROLE;
grant select on table pf_public.countries to :AUTHENTICATED_ROLE;

--! split: 2-trigger-before-insert-on-pf_countries_data.sql
drop trigger if exists _500_create_statistics_file on pf_private.pf_country_statistics cascade;
create or replace function pf_private.create_statistics_file() returns trigger
    language plpgsql security DEFINER
    AS $$
begin
  perform
    graphile_worker.add_job ('create_statistics_file', payload := json_build_object('id', (new.id), 'countryId', (new.country_id), 'datasetId', (new.dataset_id)), max_attempts := 1);
  return new;
end;
$$;

create trigger _500_create_statistics_file before insert on pf_private.pf_country_statistics for each row execute function pf_private.create_statistics_file();

--! split: 3-function-to-create-pf_countries_data.sql
drop function if exists pf_public.create_pf_country_statistics (country_id uuid, dataset_id int);

create or replace function pf_public.create_pf_country_statistics (country_id uuid, dataset_id int)
  returns setof pf_private.pf_country_statistics
  language plpgsql security DEFINER
  as $$
  declare 
    country_statistics pf_private.pf_country_statistics;
  begin
  select * into country_statistics 
  from pf_private.pf_country_statistics cs 
  where cs.country_id = create_pf_country_statistics.country_id 
  and cs.dataset_id = create_pf_country_statistics.dataset_id
  and cs.status = 'successful';
  if country_statistics is null then
    insert into pf_private.pf_country_statistics (country_id, dataset_id)
      values (create_pf_country_statistics.country_id, create_pf_country_statistics.dataset_id) 
        returning * into country_statistics;
  end if;
  return next country_statistics;
  end;
$$;

grant all on function pf_public.create_pf_country_statistics (country_id uuid, dataset_id int) to :AUTHENTICATED_ROLE;

--! split: 4-view-pf_countries_data.sql
drop view if exists pf_public.view_pf_country_statistics;

create or replace view pf_public.view_pf_country_statistics as
  select
    id,
    dataset_id,
    country_id,
    file_url,
    status
  from
    pf_private.pf_country_statistics;

grant select on pf_public.view_pf_country_statistics to :AUTHENTICATED_ROLE;

--! split: 5-create-index-for-cell.sql
create index if not exists pf_grid_coordinate_cell_idx on pf_public.pf_grid_coordinates using GIST(cell);
