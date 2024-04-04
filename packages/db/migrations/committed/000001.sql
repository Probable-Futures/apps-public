--! Previous: -
--! Hash: sha1:f4b0f440bfb2220ff291b4eae19ec1364519bbe8

--! split: 0001-schemas-and-permissions.sql
/*
 * Graphile Migrate will run our `current/...` migrations in one batch. Since
 * this is our first migration it's defining the entire database, so we first
 * drop anything that may have previously been created
 * (app_public/app_hidden/app_private) so that we can start from scratch.
 */

drop schema if exists pf_public cascade;
drop schema if exists pf_hidden cascade;
drop schema if exists pf_private cascade;

/*
 * The `public` *schema* contains things like PostgreSQL extensions. We
 * deliberately do not install application logic into the public schema
 * (instead storing it to app_public/app_hidden/app_private as appropriate),
 * but none the less we don't want untrusted roles to be able to install or
 * modify things into the public schema.
 *
 * The `public` *role* is automatically inherited by all other roles; we only
 * want specific roles to be able to access our database so we must revoke
 * access to the `public` role.
 */

revoke all on schema public from public;

alter default privileges revoke all on sequences from public;
alter default privileges revoke all on functions from public;

-- Of course we want our database owner to be able to do anything inside the
-- database, so we grant access to the `public` schema
grant all on schema public to :DATABASE_OWNER;

/*
 * Read about graphile schemas here:
 * https://www.graphile.org/postgraphile/namespaces/#advice
 */

create schema if not exists pf_public;
comment on schema pf_public is
  E'Namespace for tables and functions exposed to GraphQL';

create schema if not exists pf_hidden;
comment on schema pf_hidden is
  E'Namespace for implementation details of the `pf_public` schema that are not intended to be exposed publicly';

create schema if not exists pf_private;
comment on schema pf_private is
  E'Namespace for private tables and functions that should not be publicly accessible. Users need a `SECURITY DEFINER` function that selectively grants access to the namespace';


-- We need to do this to give the root user permissions to drop the database
grant all privileges on all tables in schema public, pf_public, pf_hidden, pf_private
  to :DATABASE_ROOT_USER;

alter default privileges for role :DATABASE_OWNER in schema public, pf_public, pf_hidden, pf_private
  grant all privileges on tables to :DATABASE_ROOT_USER;

alter default privileges for role :DATABASE_OWNER in schema public, pf_public, pf_hidden, pf_private
  grant all privileges on sequences to :DATABASE_ROOT_USER;

alter default privileges for role :DATABASE_OWNER in schema public, pf_public, pf_hidden, pf_private
  grant all privileges on functions to :DATABASE_ROOT_USER;

alter default privileges for role :DATABASE_OWNER in schema public, pf_public, pf_hidden, pf_private
  grant all privileges on types to :DATABASE_ROOT_USER;

alter default privileges for role :DATABASE_OWNER in schema public, pf_public, pf_hidden, pf_private
  grant all privileges on functions to :DATABASE_ROOT_USER;

-- The 'anonymous' role (used by PostGraphile to represent an unauthenticated user) may
-- access the public, app_public and app_hidden schemas (but _NOT_ the
-- app_private schema).
grant usage on schema public, pf_public, pf_hidden to :VISITOR_ROLE;

-- We only want the `anonymous` role to be able to insert rows (`serial` data type
-- creates sequences, so we need to grant access to that).
alter default privileges in schema public, pf_public, pf_hidden
  grant usage, select on sequences to :VISITOR_ROLE;

-- And the `anonymous` role should be able to call functions too.
alter default privileges in schema public, pf_public, pf_hidden
  grant execute on functions to :VISITOR_ROLE;

--! split: 0002-common-trigger-functions.sql
/*
 * These triggers are commonly used across many tables.
 */

-- Used for queueing jobs easily; relies on the fact that every table we have
-- has a primary key 'id' column; this won't work if you rename your primary
-- key columns.
create or replace function pf_private.tg__add_job() returns trigger as $$
begin
  perform graphile_worker.add_job(tg_argv[0], json_build_object(
    'schema', tg_table_schema,
    'table', tg_table_name,
    'op', tg_op,
    'id', (case when tg_op = 'DELETE' then OLD.id else NEW.id end)
  ));
  return NEW;
end;
$$ language plpgsql volatile;
comment on function pf_private.tg__add_job() is
  E'Useful shortcut to create a job on insert/update. Pass the task name as the first trigger argument, and optionally the queue name as the second argument. The record id will automatically be available on the JSON payload.';

/*
 * This trigger is used on tables with created_at and updated_at to ensure that
 * these timestamps are kept valid (namely: `created_at` cannot be changed, and
 * `updated_at` must be monotonically increasing).
 */
create or replace function pf_private.tg__timestamps() returns trigger as $$
begin
  NEW.created_at = (case when TG_OP = 'INSERT' then NOW() else OLD.created_at end);
  NEW.updated_at = (case when TG_OP = 'UPDATE' and OLD.updated_at >= NOW() then OLD.updated_at + interval '1 millisecond' else NOW() end);
  return NEW;
end;
$$ language plpgsql volatile;
comment on function pf_private.tg__timestamps() is
  E'This trigger function should be called on all tables with created_at, updated_at - it ensures that they cannot be manipulated and that updated_at will always be larger than the previous updated_at.';

/*
 * This trigger ensures that a `coordinate_id` column is in sync with a `coordinate_hash` column.
 * The `coordinate_id` column is to improve join performance on large tables.
 */
create or replace function pf_private.set_coordinate_id_from_hash()
  returns trigger as $$
begin
  NEW.coordinate_id = (
    case when TG_OP = 'INSERT'
      then (select id from pf_public.pf_grid_coordinates
        where md5_hash = NEW.coordinate_hash)
      when TG_OP = 'UPDATE' and
        OLD.coordinate_hash is distinct from NEW.coordinate_hash
      then (select id from pf_public.pf_grid_coordinates
        where md5_hash = NEW.coordinate_hash)
      else OLD.coordinate_id
    end
    );
  return NEW;
end;
$$ language plpgsql volatile;
comment on function pf_private.set_coordinate_id_from_hash() is
  E'Trigger function to set coordinate_id on rows with coordinate hashes';

--! split: 0003-sessions.sql
create table if not exists pf_private.connect_pg_simple_sessions (
  sid varchar not null,
  sess json not null,
  expire timestamp not null
);
comment on table pf_private.connect_pg_simple_sessions is
  E'User session storage for authentication';

create index if not exists idx_connect_pg_simple_sessions_expire
  on pf_private.connect_pg_simple_sessions (expire);

alter table pf_private.connect_pg_simple_sessions
  enable row level security;

alter table pf_private.connect_pg_simple_sessions
  add constraint session_pkey primary key (sid) not deferrable initially immediate;

--! split: 0004-dataset-models.sql
create table if not exists pf_public.pf_dataset_model_grids (
  grid text primary key,
  resolution text unique -- we could parse these further if needed
);
comment on table pf_public.pf_dataset_model_grids is
  E'Model grids are used for referencing common grids shared by multiple dataset models';
comment on column pf_public.pf_dataset_model_grids.resolution is
  E'Model grid resolution describes the number of grid cells and the area covered by an individual cell.
    The two numbers before the "&" describes the number of unique X & Y coordinates.
    The numbers after the "&" describes the size in kilometers of a grid cell.
    e.g. "1800,901&22,22" is a grid with 1800 x points 901 y points and grid cells of 22 x 22 km.';

grant select on table pf_public.pf_dataset_model_grids to :VISITOR_ROLE;

insert into pf_public.pf_dataset_model_grids (grid, resolution) values
  ('GCM', '240,120&167,167'),
  ('RCM', '1800,901&22,22');

create table if not exists pf_public.pf_dataset_model_sources (
  model text primary key,
  grid text not null references pf_public.pf_dataset_model_grids(grid)
);
comment on table pf_public.pf_dataset_model_sources is
  E'Model sources reference the original climate models which were used to produce the Probable Futures datasets.';

grant select on table pf_public.pf_dataset_model_sources to :VISITOR_ROLE;

insert into pf_public.pf_dataset_model_sources (model, grid) values
  ('CMIP5', 'GCM'),
  ('global REMO', 'RCM'),
  ('regional REMO', 'RCM'),
  ('global RegCM and REMO', 'RCM');

--! split: 0005-dataset-units-categories-and-warming-scenarios.sql
create table if not exists pf_public.pf_dataset_units (
  unit text primary key,
  unit_long text
);
comment on table pf_public.pf_dataset_units is
  E'Valid unit names for Probable Futures datasets';

grant select on table pf_public.pf_dataset_units to :VISITOR_ROLE;

insert into pf_public.pf_dataset_units (unit, unit_long) values
  ('days', 'Number of days'),
  ('°C', 'Temperature (°C)'),
  ('class', null);

create table if not exists pf_public.pf_dataset_categories (
  category citext primary key
);
comment on table pf_public.pf_dataset_categories is
  E'The categories for grouping Probable Futures datasets';

grant select on table pf_public.pf_dataset_categories to :VISITOR_ROLE;

insert into pf_public.pf_dataset_categories (category) values
  ('increasing heat'),
  ('decreasing cold'),
  ('heat and humidity');

create table if not exists pf_public.pf_warming_scenarios (
  slug text primary key,
  name text,
  description text
);
comment on table pf_public.pf_warming_scenarios is
  E'Warming scenarios forecasted in Probable Futures dataset statistics';

grant select on table pf_public.pf_warming_scenarios to :VISITOR_ROLE;

insert into pf_public.pf_warming_scenarios (slug) values
  ('0.5'),
  ('1.0'),
  ('1.5'),
  ('2.0'),
  ('2.5'),
  ('3.0');

--! split: 0006-datasets.sql
create table if not exists pf_public.pf_datasets (
  id integer unique primary key,
  slug citext not null unique,
  name text not null,
  description text,
  category citext references pf_public.pf_dataset_categories(category)
    on update cascade,
  model text references pf_public.pf_dataset_model_sources(model)
    on update cascade,
  unit citext references pf_public.pf_dataset_units(unit)
    on update cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table pf_public.pf_datasets is
  E'Metadata for Probable Futures datasets';

grant select on table pf_public.pf_datasets to :VISITOR_ROLE;

create index if not exists pf_dataset_slug_idx
  on pf_public.pf_datasets (slug);

create index if not exists pf_dataset_category_idx
  on pf_public.pf_datasets (category);

create index if not exists pf_dataset_model_idx
  on pf_public.pf_datasets (model);

create index if not exists pf_dataset_unit_idx
  on pf_public.pf_datasets (unit);

drop trigger if exists _100_timestamps
  on pf_public.pf_datasets cascade;
create trigger _100_timestamps
  before insert or update on pf_public.pf_datasets
  for each row
  execute procedure pf_private.tg__timestamps();

--! split: 0007-dataset-coordinates.sql
create table if not exists pf_public.pf_grid_coordinates (
  id uuid default gen_random_uuid() primary key,
  md5_hash text unique generated always as (
    md5(grid || ST_AsEWKT(point))) stored,
  grid text not null references pf_public.pf_dataset_model_grids(grid)
    on update cascade,
  point geography(Point,4326) not null,
  cell geography(Polygon, 4326) generated always as (
    case
      when grid = 'RCM' then ST_MakeEnvelope(
            ((ST_X(point::geometry)) - 0.09999999660721),
            ((ST_Y(point::geometry)) + 0.099999999999991),
            ((ST_X(point::geometry)) + 0.09999999660721),
            ((ST_Y(point::geometry)) - 0.099999999999991),
          4326)::geography
      when grid = 'GCM' then ST_MakeEnvelope(
            ((ST_X(point::geometry)) - 0.625),
            ((ST_Y(point::geometry)) + 0.471204188481675),
            ((ST_X(point::geometry)) + 0.625),
            ((ST_Y(point::geometry)) - 0.471204188481675),
          4326)::geography
      end ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table pf_public.pf_grid_coordinates is
  E'Dataset coordinates contains the geographic data for coordinates in particular model grids.
    Datasets with different model sources but the same model grid will share the same coordintes';
comment on column pf_public.pf_grid_coordinates.md5_hash is
  E'MD5 Hash of the EWKT of the coordinate point, used as a FK for raw and statistical data';
comment on column pf_public.pf_grid_coordinates.cell is
  E'Bounding box around the climate point, used for dataset tilesets';

create index if not exists pf_grid_coordinate_point_idx
  on pf_public.pf_grid_coordinates
  using gist (point);
comment on index pf_grid_coordinate_point_idx is
  E'This GiST index is necessary for speeding up spatial queries';

create index if not exists pf_grid_coordinate_point_hash_idx
  on pf_public.pf_grid_coordinates
  using hash (md5_hash);

create index if not exists pf_grid_coordinate_grid_idx
  on pf_public.pf_grid_coordinates (grid);

grant select on table pf_public.pf_grid_coordinates to :VISITOR_ROLE;

drop trigger if exists _100_timestamps
  on pf_public.pf_grid_coordinates cascade;
create trigger _100_timestamps
  before insert or update on pf_public.pf_grid_coordinates
  for each row
  execute procedure pf_private.tg__timestamps();

--! split: 0008-dataset-statistics.sql
create table if not exists pf_public.pf_statistical_variable_names (
  slug citext primary key,
  name text,
  dataset_id integer references pf_public.pf_datasets(id)
    on update cascade
    on delete cascade,
  description text
);
comment on table pf_public.pf_statistical_variable_names is
  E'Table storing variable names across datasets';

create table if not exists pf_public.pf_dataset_statistics (
  id uuid default gen_random_uuid() primary key,
  dataset_id integer not null references pf_public.pf_datasets(id)
    on update cascade
    on delete cascade,
  coordinate_id uuid references pf_public.pf_grid_coordinates(id)
    on update cascade,
  coordinate_hash text not null references pf_public.pf_grid_coordinates(md5_hash)
    on update cascade,
  warming_scenario text not null references pf_public.pf_warming_scenarios(slug)
    on update cascade,
  pctl10 numeric(4,1),
  mean numeric(4,1),
  pctl90 numeric(4,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table pf_public.pf_dataset_statistics is
  E'Normalized climate statistics for Probable Futures climate data';
comment on column pf_public.pf_dataset_statistics.coordinate_hash is
  E'Md5 hash of the dataset grid + EWTK of the coordinate point. Used for inserting statistics without looking up a coordinate id';
comment on column pf_public.pf_dataset_statistics.coordinate_id is
  E'UUID of the grid coordinate for the statistic. Added by trigger after a row is inserted. Use this column when joining with pf_dataset_coordinates';

create index if not exists pf_dataset_stats_dataset_idx
  on pf_public.pf_dataset_statistics (dataset_id);

create index if not exists pf_dataset_stats_coordinate_hash_idx
  on pf_public.pf_dataset_statistics
  using hash(coordinate_hash);

create index if not exists pf_dataset_stats_coordinate_idx
  on pf_public.pf_dataset_statistics (coordinate_id);

create index if not exists pf_dataset_stats_warming_idx
  on pf_public.pf_dataset_statistics (warming_scenario);

drop trigger if exists _100_timestamps
  on pf_public.pf_dataset_statistics cascade;
create trigger _100_timestamps
  before insert or update on pf_public.pf_dataset_statistics
  for each row
  execute procedure pf_private.tg__timestamps();

drop trigger if exists _200_set_coordinate_id
  on pf_public.pf_dataset_statistics cascade;
create trigger _200_set_coordinate_id
  before insert or update on pf_public.pf_dataset_statistics
  for each row
  execute procedure pf_private.set_coordinate_id_from_hash();
comment on trigger _200_set_coordinate_id
  on pf_public.pf_dataset_statistics is
  E'Set coordinate_id for improved join performance over coordinate_hash';

-- The below views are private because they are only used for exporting for tilesets.
-- The queries are expensive, so users should not be able to execute them directly.
create or replace view pf_private.aggregate_pf_dataset_statistics as
  select coordinate_id, dataset_id,
    unnest(array_agg(pctl10) filter (where warming_scenario = '0.5')) as data_baseline_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '0.5')) as data_baseline_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '0.5')) as data_baseline_pctl90,
    unnest(array_agg(pctl10) filter (where warming_scenario = '1.0')) as data_1c_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '1.0')) as data_1c_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '1.0')) as data_1c_pctl90,
    unnest(array_agg(pctl10) filter (where warming_scenario = '1.5')) as data_1_5c_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '1.5')) as data_1_5c_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '1.5')) as data_1_5c_pctl90,
    unnest(array_agg(pctl10) filter (where warming_scenario = '2.0')) as data_2c_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '2.0')) as data_2c_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '2.0')) as data_2c_pctl90,
    unnest(array_agg(pctl10) filter (where warming_scenario = '2.5')) as data_2_5c_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '2.5')) as data_2_5c_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '2.5')) as data_2_5c_pctl90,
    unnest(array_agg(pctl10) filter (where warming_scenario = '3.0')) as data_3c_pctl10,
    unnest(array_agg(mean) filter (where warming_scenario = '3.0')) as data_3c_mean,
    unnest(array_agg(pctl90) filter (where warming_scenario = '3.0')) as data_3c_pctl90
  from pf_public.pf_dataset_statistics
  group by coordinate_id, dataset_id;
comment on view pf_private.aggregate_pf_dataset_statistics is
  E'View aggregate dataset statistics across all warming scenarios';

create or replace view pf_private.aggregate_pf_dataset_statistic_cells as
  select coords.cell, stats.*
  from pf_private.aggregate_pf_dataset_statistics stats
  join pf_public.pf_grid_coordinates coords
  on stats.coordinate_id = coords.id;
comment on view pf_private.aggregate_pf_dataset_statistic_cells is
  E'View aggregate dataset statistics joined with coordinate cells';

--! split: 0009-maps.sql
create table if not exists pf_public.pf_map_statuses (
  status text primary key
);
comment on table pf_public.pf_map_statuses is
  E'Valid state of map publishing statuses';

grant select on table pf_public.pf_map_statuses to :VISITOR_ROLE;

insert into pf_public.pf_map_statuses (status) values
 ('draft'),
 ('published');

drop domain if exists pf_public.hex_color cascade;
create domain pf_public.hex_color as citext check (
  value ~ '^#([0-9a-f]){3}(([0-9a-f]){3})?$'
);
comment on domain pf_public.hex_color is
  E'Hex colors must be a case insensitive string of 3 or 6 alpha-numeric characters prefixed with a `#`';

create table if not exists pf_public.pf_maps (
  id uuid default gen_random_uuid() primary key,
  dataset_id integer not null references pf_public.pf_datasets(id),
  map_style_id varchar(50) unique,
  name text not null,
  description text,
  bins integer[],
  bin_hex_colors hex_color[],
  status text not null default 'draft' references pf_public.pf_map_statuses(status),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table pf_public.pf_maps is
  E'Relates a dataset to a map style stored in Mapbox';

grant select on table pf_public.pf_maps to :VISITOR_ROLE;

drop trigger if exists _100_timestamps
  on pf_public.pf_maps cascade;
create trigger _100_timestamps
  before insert or update on pf_public.pf_maps
  for each row
  execute procedure pf_private.tg__timestamps();

create index if not exists pf_map_dataset_idx
  on pf_public.pf_maps (dataset_id);
create index if not exists pf_map_status_idx
  on pf_public.pf_maps (status);

--! split: 0010-partner-platform.sql
create table if not exists pf_private.pf_partner_projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table pf_private.pf_partner_projects is
  E'Partner projects are collections of partner datasets and a Probable Futures dataset';

drop trigger if exists _100_timestamps
  on pf_private.pf_partner_projects cascade;
create trigger _100_timestamps
  before insert or update on pf_private.pf_partner_projects
  for each row
  execute procedure pf_private.tg__timestamps();

create table if not exists pf_private.pf_partner_datasets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table pf_private.pf_partner_datasets is
  E'The metadata for a partner supplied dataset';

drop trigger if exists _100_timestamps
  on pf_private.pf_partner_datasets cascade;
create trigger _100_timestamps
  before insert or update on pf_private.pf_partner_datasets
  for each row
  execute procedure pf_private.tg__timestamps();

create table if not exists pf_private.pf_partner_project_datasets (
  project_id uuid not null references pf_private.pf_partner_projects
    on delete cascade,
  dataset_id uuid not null references pf_private.pf_partner_datasets
    on delete cascade
);
comment on table pf_private.pf_partner_project_datasets is
  E'Relationship between a partner project and a partner dataset';

create table if not exists pf_private.pf_partner_dataset_uploads (
  id uuid default gen_random_uuid() primary key,
  partner_dataset_id uuid not null references pf_private.pf_partner_datasets(id)
    on delete cascade,
  original_file text,
  pre_processed_file text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table pf_private.pf_partner_dataset_uploads is
  E'Dataset files uploaded by partners for enrichment with Probable Futures climate data';
comment on column pf_private.pf_partner_dataset_uploads.original_file is
  E'S3 url for unaltered dataset uploaded by a partner';
comment on column pf_private.pf_partner_dataset_uploads.pre_processed_file is
  E'S3 url for partner dataset with uuids assigned to each row';

drop trigger if exists _100_timestamps
  on pf_private.pf_partner_dataset_uploads cascade;
create trigger _100_timestamps
  before insert or update on pf_private.pf_partner_dataset_uploads
  for each row
  execute procedure pf_private.tg__timestamps();

create table if not exists pf_private.pf_partner_dataset_coordinates (
  id uuid default gen_random_uuid() primary key,
  partner_dataset_id uuid not null references pf_private.pf_partner_datasets
    on delete cascade,
  partner_dataset_row_id uuid not null,
  coordinates geography(Point, 4326) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_dataset_id, partner_dataset_row_id)
);
comment on table pf_private.pf_partner_dataset_coordinates is
  E'This table saves partner dataset row ids and their coordinates for performing spatial queries against PF dataset coordinates';

drop trigger if exists _100_timestamps
  on pf_private.pf_partner_dataset_coordinates cascade;
create trigger _100_timestamps
  before insert or update on pf_private.pf_partner_dataset_coordinates
  for each row
  execute procedure pf_private.tg__timestamps();

create index if not exists pf_partner_dataset_coordinates_idx
  on pf_private.pf_partner_dataset_coordinates
  using gist(coordinates);
comment on index pf_partner_dataset_coordinates_idx is
  E'This GiST index is necessary for speeding up spatial queries';

--! split: 0011-partner-enrichment.sql
create table if not exists pf_private.pf_partner_enrichment_statuses (
  status text primary key
);
comment on table pf_private.pf_partner_enrichment_statuses is
  E'Valid enrichment statuses of partner datatset';

insert into pf_private.pf_partner_enrichment_statuses (status) values
  ('requested'),
  ('in progress'),
  ('failed'),
  ('successful');

create table if not exists pf_private.pf_partner_dataset_enrichments (
  id uuid default gen_random_uuid() primary key,
  pf_dataset_id integer not null references pf_public.pf_datasets(id),
  partner_dataset_id uuid not null references pf_private.pf_partner_datasets
    on delete cascade,
  status text default 'requested' references pf_private.pf_partner_enrichment_statuses(status)
    on update cascade,
  enriched_dataset_file text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table pf_private.pf_partner_dataset_enrichments is
  E'Table for initiating partner dataset enrichments and referencing enriched datasets';
comment on column pf_private.pf_partner_dataset_enrichments.enriched_dataset_file is
  E'File combining original partner dataset data with PF climate of nearby points';

drop trigger if exists _100_timestamps
  on pf_private.pf_partner_dataset_enrichments cascade;
create trigger _100_timestamps
  before insert or update on pf_private.pf_partner_dataset_enrichments
  for each row
  execute procedure pf_private.tg__timestamps();
