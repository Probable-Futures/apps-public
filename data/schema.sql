--
-- PostgreSQL database dump
--

-- Dumped from database version 13.1
-- Dumped by pg_dump version 16.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pf_hidden; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pf_hidden;


--
-- Name: SCHEMA pf_hidden; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA pf_hidden IS 'Namespace for implementation details of the `pf_public` schema that are not intended to be exposed publicly';


--
-- Name: pf_private; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pf_private;


--
-- Name: SCHEMA pf_private; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA pf_private IS 'Namespace for private tables and functions that should not be publicly accessible. Users need a `SECURITY DEFINER` function that selectively grants access to the namespace';


--
-- Name: pf_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pf_public;


--
-- Name: SCHEMA pf_public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA pf_public IS 'Namespace for tables and functions exposed to GraphQL';


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: dataset_statistics_response; Type: TYPE; Schema: pf_public; Owner: -
--

CREATE TYPE pf_public.dataset_statistics_response AS (
	dataset_id integer,
	name text,
	unit public.citext,
	warming_scenario text,
	low_value numeric(6,1),
	mid_value numeric(6,1),
	high_value numeric(6,1),
	longitude double precision,
	latitude double precision,
	map_category text,
	x numeric[],
	y numeric[]
);


--
-- Name: hex_color; Type: DOMAIN; Schema: pf_public; Owner: -
--

CREATE DOMAIN pf_public.hex_color AS public.citext
	CONSTRAINT hex_color_check CHECK ((VALUE OPERATOR(public.~) '^#([0-9a-f]){3}(([0-9a-f]){3})?$'::public.citext));


--
-- Name: DOMAIN hex_color; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON DOMAIN pf_public.hex_color IS 'Hex colors must be a case insensitive string of 3 or 6 alpha-numeric characters prefixed with a `#`';


--
-- Name: project_share_response; Type: TYPE; Schema: pf_public; Owner: -
--

CREATE TYPE pf_public.project_share_response AS (
	pf_dataset_id integer,
	map_config jsonb,
	project_datasets jsonb
);


--
-- Name: create_statistics_file(); Type: FUNCTION; Schema: pf_private; Owner: -
--

CREATE FUNCTION pf_private.create_statistics_file() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  perform
    graphile_worker.add_job ('create_statistics_file', payload := json_build_object('id', (new.id), 'countryId', (new.country_id), 'datasetId', (new.dataset_id)), max_attempts := 1);
  return new;
end;
$$;


--
-- Name: delete_partner_dataset_files(); Type: FUNCTION; Schema: pf_private; Owner: -
--

CREATE FUNCTION pf_private.delete_partner_dataset_files() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    declare 
      files text[];
begin
  select array_agg(distinct file_name) 
    into files
    from (
      select original_file as file_name from pf_private.pf_partner_dataset_uploads where partner_dataset_id = old.id and original_file is not null
      union
      select processed_file as file_name from pf_private.pf_partner_dataset_uploads where partner_dataset_id = old.id and processed_file is not null
      union
      select processed_with_coordinates_file as file_name from pf_private.pf_partner_dataset_uploads where partner_dataset_id = old.id and processed_with_coordinates_file is not null
      union 
      select enriched_dataset_file from pf_private.pf_partner_dataset_enrichments where partner_dataset_id = old.id and enriched_dataset_file is not null
    ) as files;
    if (select cardinality(files::text[])) >= 1
    then
      perform
        graphile_worker.add_job ('delete_partner_dataset_files', payload := json_build_object('id', (old.id), 'partnerId', (old.partner_id), 'files', files), max_attempts := 1);
    end if;
  return old;
end;
$$;


--
-- Name: enrich_partner_dataset(); Type: FUNCTION; Schema: pf_private; Owner: -
--

CREATE FUNCTION pf_private.enrich_partner_dataset() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  perform graphile_worker.add_job('enrich_partner_dataset',
    payload := json_build_object(
    'id', (NEW.id),
    'partnerId', (NEW.partner_id),
    'pfDatasetId', (NEW.pf_dataset_id),
    'uploadId', (NEW.upload_id),
    'partnerDatasetId', (NEW.partner_dataset_id)),
    max_attempts := 1);
  return new;
end;
$$;


--
-- Name: process_partner_dataset_upload(); Type: FUNCTION; Schema: pf_private; Owner: -
--

CREATE FUNCTION pf_private.process_partner_dataset_upload() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  if new.enrich = true and TG_OP = 'INSERT' then
    perform
      graphile_worker.add_job ('process_partner_dataset', payload := json_build_object('id', (new.id), 'partnerId', (new.partner_id), 'originalFile', (new.original_file), 'partnerDatasetId', (new.partner_dataset_id), 'geodataType', (new.geodata_type)), max_attempts := 1);
  end if;
  return new;
end;
$$;


--
-- Name: set_cell_from_model(); Type: FUNCTION; Schema: pf_private; Owner: -
--

CREATE FUNCTION pf_private.set_cell_from_model() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  NEW.cell = (
    case
      when TG_OP = 'INSERT' or (TG_OP = 'UPDATE' and OLD.cell is distinct from NEW.cell) 
        then case
          when NEW.grid = 'RCM' then ST_MakeEnvelope(
            ((ST_X(NEW.point :: geometry)) - 0.09999999660721),
            ((ST_Y(NEW.point :: geometry)) + 0.099999999999991),
            ((ST_X(NEW.point :: geometry)) + 0.09999999660721),
            ((ST_Y(NEW.point :: geometry)) - 0.099999999999991),
            4326
          ) :: geography
          when NEW.grid = 'GCM' then ST_MakeEnvelope(
            ((ST_X(NEW.point :: geometry)) - 0.75225225),
            ((ST_Y(NEW.point :: geometry)) + 0.75225225),
            ((ST_X(NEW.point :: geometry)) + 0.75225225),
            ((ST_Y(NEW.point :: geometry)) - 0.75225225),
            4326
          ) :: geography
        end
      else OLD.cell
    end
  );
  return NEW;
end;
$$;


--
-- Name: FUNCTION set_cell_from_model(); Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON FUNCTION pf_private.set_cell_from_model() IS 'Trigger function to set cell for new rows';


--
-- Name: tg__add_job(); Type: FUNCTION; Schema: pf_private; Owner: -
--

CREATE FUNCTION pf_private.tg__add_job() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  perform graphile_worker.add_job(tg_argv[0], json_build_object(
    'schema', tg_table_schema,
    'table', tg_table_name,
    'op', tg_op,
    'id', (case when tg_op = 'DELETE' then OLD.id else NEW.id end)
  ));
  return NEW;
end;
$$;


--
-- Name: FUNCTION tg__add_job(); Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON FUNCTION pf_private.tg__add_job() IS 'Useful shortcut to create a job on insert/update. Pass the task name as the first trigger argument, and optionally the queue name as the second argument. The record id will automatically be available on the JSON payload.';


--
-- Name: tg__timestamps(); Type: FUNCTION; Schema: pf_private; Owner: -
--

CREATE FUNCTION pf_private.tg__timestamps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  NEW.created_at = (case when TG_OP = 'INSERT' then NOW() else OLD.created_at end);
  NEW.updated_at = (case when TG_OP = 'UPDATE' and OLD.updated_at >= NOW() then OLD.updated_at + interval '1 millisecond' else NOW() end);
  return NEW;
end;
$$;


--
-- Name: FUNCTION tg__timestamps(); Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON FUNCTION pf_private.tg__timestamps() IS 'This function should be called by an admin to add an example dataset after uploading it.';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: pf_users; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sub text NOT NULL,
    name text,
    email public.citext NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE pf_users; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON TABLE pf_private.pf_users IS 'A user who can log in to the application.';


--
-- Name: COLUMN pf_users.sub; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON COLUMN pf_private.pf_users.sub IS 'Unique OAuth Subject identifier for the user.';


--
-- Name: upsert_user_and_log_last_active_at(text, public.citext, text); Type: FUNCTION; Schema: pf_private; Owner: -
--

CREATE FUNCTION pf_private.upsert_user_and_log_last_active_at(sub text, email public.citext, name text) RETURNS pf_private.pf_users
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    AS $$
  declare
    _user pf_private.pf_users;
  begin
    if not exists (select * from pf_private.pf_users
        where pf_private.pf_users.sub = upsert_user_and_log_last_active_at.sub)
      then
      insert into pf_private.pf_users
        (sub, email, name)
      values
        (upsert_user_and_log_last_active_at.sub,
         upsert_user_and_log_last_active_at.email,
         upsert_user_and_log_last_active_at.name);
    end if;
    update pf_private.pf_users set last_seen_at = now()
    where pf_private.pf_users.sub = upsert_user_and_log_last_active_at.sub
      and last_seen_at < now() - interval '5 minutes';
    select * from pf_private.pf_users
      where pf_private.pf_users.sub = upsert_user_and_log_last_active_at.sub
      into _user;
    return _user;
  end;
  $$;


--
-- Name: add_partner_example_dataset(text, text, text, text); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.add_partner_example_dataset(name text, description text, original_file text, geodata_type text) RETURNS boolean
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    AS $$
declare
  new_partner_dataset_id uuid;
  admin_id uuid;
begin
  select
    id into admin_id
  from
    pf_private.pf_users
  where
    sub = 'admin';
  insert into pf_private.pf_partner_datasets (name, description, partner_id, is_example)
    values (add_partner_example_dataset.name, add_partner_example_dataset.description, admin_id, true)
  returning
    id into new_partner_dataset_id;
  insert into pf_private.pf_partner_dataset_uploads (partner_dataset_id, original_file, partner_id, geodata_type, enrich)
    values (new_partner_dataset_id, add_partner_example_dataset.original_file, admin_id, add_partner_example_dataset.geodata_type, false);
  return true;
end;
$$;


--
-- Name: pf_partner_project_datasets; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_partner_project_datasets (
    project_id uuid NOT NULL,
    dataset_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE pf_partner_project_datasets; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON TABLE pf_private.pf_partner_project_datasets IS 'Relationship between a partner project and a partner dataset';


--
-- Name: associate_partner_project_and_dataset(uuid, uuid); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.associate_partner_project_and_dataset(project_id uuid, dataset_id uuid) RETURNS pf_private.pf_partner_project_datasets
    LANGUAGE sql
    AS $$
  insert into pf_private.pf_partner_project_datasets
    (project_id, dataset_id)
  values
    (project_id, dataset_id)
  returning *;
$$;


--
-- Name: authenticate_pf_user(public.citext, text); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.authenticate_pf_user(email public.citext, name text) RETURNS pf_private.pf_users
    LANGUAGE sql SECURITY DEFINER
    AS $$
  select pf_private.upsert_user_and_log_last_active_at(
    pf_public.current_user_sub(),
    email,
    name
  );
$$;


--
-- Name: create_audit(text, jsonb, text, text, integer); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.create_audit(action_type text, payload jsonb, user_ip text, message text, rate_limit_threshold integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  insert into pf_private.pf_audit (message, action_type, user_sub, user_ip, payload, rate_limit_threshold)
    values (message, action_type, pf_public.current_user_sub (), user_ip, payload, rate_limit_threshold);
end;
$$;


--
-- Name: pf_partner_datasets; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_partner_datasets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    partner_id uuid NOT NULL,
    is_example boolean DEFAULT false
);


--
-- Name: TABLE pf_partner_datasets; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON TABLE pf_private.pf_partner_datasets IS 'The metadata for a partner supplied dataset';


--
-- Name: create_partner_dataset(text, text); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.create_partner_dataset(name text, description text) RETURNS pf_private.pf_partner_datasets
    LANGUAGE sql
    AS $$
  insert into pf_private.pf_partner_datasets
    (name, description, partner_id)
  values
    (name, description, (pf_public.current_user()).id)
  returning *;
$$;


--
-- Name: pf_partner_dataset_enrichments; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_partner_dataset_enrichments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pf_dataset_id integer NOT NULL,
    partner_dataset_id uuid NOT NULL,
    status text DEFAULT 'requested'::text,
    enriched_dataset_file text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    partner_id uuid NOT NULL,
    upload_id uuid,
    project_id uuid,
    enriched_row_count integer,
    enrichment_errors jsonb,
    enrichment_time_ms integer
);


--
-- Name: TABLE pf_partner_dataset_enrichments; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON TABLE pf_private.pf_partner_dataset_enrichments IS 'Table for initiating partner dataset enrichments and referencing enriched datasets';


--
-- Name: COLUMN pf_partner_dataset_enrichments.enriched_dataset_file; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON COLUMN pf_private.pf_partner_dataset_enrichments.enriched_dataset_file IS 'File combining original partner dataset data with PF climate of nearby points';


--
-- Name: create_partner_dataset_enrichment(integer, uuid, uuid, uuid); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.create_partner_dataset_enrichment(pf_dataset_id integer, partner_dataset_id uuid, upload_id uuid, project_id uuid) RETURNS pf_private.pf_partner_dataset_enrichments
    LANGUAGE sql
    AS $$
  insert into pf_private.pf_partner_dataset_enrichments
    (pf_dataset_id, partner_dataset_id, upload_id, project_id, partner_id)
  values
    (pf_dataset_id, partner_dataset_id, upload_id, project_id, (pf_public.current_user()).id)
  returning *;
$$;


--
-- Name: pf_partner_dataset_uploads; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_partner_dataset_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_dataset_id uuid NOT NULL,
    original_file text,
    processed_file text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    partner_id uuid NOT NULL,
    csv_headers text[],
    processed_row_count integer,
    processing_errors jsonb,
    processing_time_ms integer,
    processed_with_coordinates_file text,
    processed_with_coordinates_row_count integer,
    processing_with_coordinates_errors jsonb,
    processing_with_coordinates_time_ms integer,
    geodata_type text DEFAULT 'latLon'::text,
    enrich boolean DEFAULT true,
    status text DEFAULT 'requested'::text
);


--
-- Name: TABLE pf_partner_dataset_uploads; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON TABLE pf_private.pf_partner_dataset_uploads IS 'Dataset files uploaded by partners for enrichment with Probable Futures climate data';


--
-- Name: COLUMN pf_partner_dataset_uploads.original_file; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON COLUMN pf_private.pf_partner_dataset_uploads.original_file IS 'S3 url for unaltered dataset uploaded by a partner';


--
-- Name: COLUMN pf_partner_dataset_uploads.processed_file; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON COLUMN pf_private.pf_partner_dataset_uploads.processed_file IS 'S3 url for partner dataset with uuids assigned to each row';


--
-- Name: create_partner_dataset_upload(text, uuid, text, boolean); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.create_partner_dataset_upload(file_url text, dataset_id uuid, geodata_type text, enrich boolean) RETURNS pf_private.pf_partner_dataset_uploads
    LANGUAGE sql
    AS $$
  insert into pf_private.pf_partner_dataset_uploads (original_file, partner_dataset_id, geodata_type, partner_id, enrich)
    values (file_url, dataset_id, geodata_type, (pf_public.current_user()).id, enrich)
  returning
    *
$$;


--
-- Name: pf_partner_projects; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_partner_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    partner_id uuid NOT NULL,
    map_config jsonb,
    image_url text,
    pf_dataset_id integer
);


--
-- Name: TABLE pf_partner_projects; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON TABLE pf_private.pf_partner_projects IS 'Partner projects are collections of partner datasets and a Probable Futures dataset';


--
-- Name: create_partner_project(text, text, integer); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.create_partner_project(name text, description text, pf_dataset_id integer) RETURNS pf_private.pf_partner_projects
    LANGUAGE sql
    AS $$
  insert into pf_private.pf_partner_projects (name, description, pf_dataset_id, partner_id)
    values (name, description, pf_dataset_id, (pf_public.current_user()).id)
  returning
    *;

$$;


--
-- Name: pf_partner_project_shares; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_partner_project_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL
);


--
-- Name: create_partner_project_share(uuid); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.create_partner_project_share(project_id uuid) RETURNS pf_private.pf_partner_project_shares
    LANGUAGE sql
    AS $$
  insert into pf_private.pf_partner_project_shares
    (project_id)
  values
    (project_id)
  returning *;
$$;


--
-- Name: pf_country_statistics; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_country_statistics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_id uuid NOT NULL,
    dataset_id integer NOT NULL,
    file_url text,
    status text DEFAULT 'requested'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: create_pf_country_statistics(uuid, integer); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.create_pf_country_statistics(country_id uuid, dataset_id integer) RETURNS SETOF pf_private.pf_country_statistics
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  declare 
    country_statistics pf_private.pf_country_statistics;
  begin
  select * into country_statistics 
  from pf_private.pf_country_statistics cs 
  where cs.country_id = create_pf_country_statistics.country_id 
  and cs.dataset_id = create_pf_country_statistics.dataset_id
  and (cs.status = 'successful' or cs.status = 'in progress');
  if country_statistics is null then
    insert into pf_private.pf_country_statistics (country_id, dataset_id)
      values (create_pf_country_statistics.country_id, create_pf_country_statistics.dataset_id) 
        returning * into country_statistics;
  end if;
  return next country_statistics;
  end;
$$;


--
-- Name: create_user_access_request(text, text, jsonb); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.create_user_access_request(form_name text, email text, form_fields jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
    new_id uuid;
begin
    insert into pf_private.pf_user_access_requests (form_name, email, form_fields, create_by_user_sub)
        values (form_name, email, form_fields, pf_public.current_user_sub())
    returning id into new_id;
    return new_id;
end;
$$;


--
-- Name: current_user(); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public."current_user"() RETURNS pf_private.pf_users
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  select * from pf_private.pf_users
  where id = pf_public.current_user_id();
$$;


--
-- Name: current_user_id(); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.current_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select id from pf_private.pf_users where sub = pf_public.current_user_sub();
$$;


--
-- Name: current_user_sub(); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.current_user_sub() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select nullif(pg_catalog.current_setting('pf_user.sub', true), '')::text;
$$;


--
-- Name: FUNCTION current_user_sub(); Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON FUNCTION pf_public.current_user_sub() IS 'Handy method to get the current user sub id.';


--
-- Name: delete_partner_dataset(uuid); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.delete_partner_dataset(dataset_id uuid) RETURNS boolean
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    AS $$
begin
  if not exists (
    select
      1
    from
      pf_private.pf_partner_datasets
    where
      id = dataset_id) then
  raise exception 'dataset % not found', dataset_id;
end if;
  delete from pf_private.pf_partner_datasets
  where id = dataset_id
    and partner_id = (pf_public.current_user()).id;
  return true;
end;
$$;


--
-- Name: delete_partner_project(uuid); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.delete_partner_project(project_id uuid) RETURNS boolean
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    AS $$
begin
  if not exists (
    select
      1
    from
      pf_private.pf_partner_projects
    where
      id = project_id) then
  raise exception 'project % not found', project_id;
end if;
  delete from pf_private.pf_partner_datasets
  where id in (
      select
        d.id
      from
        pf_private.pf_partner_datasets d
        inner join pf_private.pf_partner_project_datasets pd on d.id = pd.dataset_id
        inner join pf_private.pf_partner_projects p on p.id = pd.project_id
      where
        p.id = delete_partner_project.project_id
        and d.partner_id = (pf_public.current_user()).id);
  delete from pf_private.pf_partner_projects
  where id = project_id;
  return true;
end;
$$;


--
-- Name: delete_partner_project_dataset(uuid, uuid); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.delete_partner_project_dataset(project_id uuid, dataset_id uuid) RETURNS boolean
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    AS $$
begin
  delete from pf_private.pf_partner_project_datasets ppd
  where ppd.dataset_id = delete_partner_project_dataset.dataset_id
    and ppd.project_id = delete_partner_project_dataset.project_id;
  return true;
end;
$$;


--
-- Name: get_dataset_statistics(double precision, double precision, numeric[], integer); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.get_dataset_statistics(longitude double precision, latitude double precision, warming_scenario numeric[] DEFAULT NULL::numeric[], dataset_id integer DEFAULT NULL::integer) RETURNS SETOF pf_public.dataset_statistics_response
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  if get_dataset_statistics.longitude::DECIMAL < - 180.0 or get_dataset_statistics.longitude::DECIMAL > 180.0 then
    raise exception 'Invalid longitude param.';
  end if;
  if get_dataset_statistics.latitude::DECIMAL < - 90.0 or get_dataset_statistics.latitude::DECIMAL > 90.0 then
    raise exception 'Invalid latitude param.';
  end if;
  return QUERY 
    (with pf_gc as (
      select
        gc.md5_hash, (ST_X (gc.point::geometry)) as lon, (ST_Y (gc.point::geometry)) as lat from pf_public.pf_grid_coordinates as gc
      where
        gc.grid = 'RCM' order by gc.point <-> ST_SetSRID (ST_MakePoint (get_dataset_statistics.longitude::DECIMAL, get_dataset_statistics.latitude::DECIMAL), 4326)
      limit 1)
    select
      pds.dataset_id as dataset_id, m.name as name, d.unit as unit, pds.warming_scenario, pds.low_value as low_value,
      pds.mid_value as mid_value, pds.high_value as high_value,
      (select lon as longitude from pf_gc), 
      (select lat as latitude from pf_gc),
      d.parent_category as map_category,
      pds.x as x,
      pds.y as y
    from pf_public.pf_dataset_statistics as pds
    join pf_public.pf_datasets d on d.id = pds.dataset_id
    join pf_public.pf_maps m on m.dataset_id = pds.dataset_id and m.is_latest
    where
    pds.coordinate_hash = (
      select
        md5_hash
      from pf_gc)
    and (get_dataset_statistics.dataset_id is null
      or pds.dataset_id = get_dataset_statistics.dataset_id)
    and (get_dataset_statistics.warming_scenario is null or pds.warming_scenario::numeric = any(get_dataset_statistics.warming_scenario))
  );
end;
$$;


--
-- Name: insert_map_with_a_new_mid_value_method(integer, character varying, text); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.insert_map_with_a_new_mid_value_method(dataset_id integer, map_style_id character varying, method_used_for_mid text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ 
begin 
insert into pf_public.pf_maps (
  dataset_id, map_style_id, name, description, 
  stops, bin_hex_colors, status, "order", 
  is_diff, step, 
  binning_type, bin_labels, slug, 
  is_latest, map_version, data_labels,
  method_used_for_mid
) 
select 
  m.dataset_id, 
  insert_map_with_a_new_mid_value_method.map_style_id, 
  m.name, 
  m.description, 
  m.stops, 
  m.bin_hex_colors, 
  'draft',
  m."order", 
  m.is_diff, 
  m.step, 
  m.binning_type, 
  m.bin_labels, 
  m.slug,
  false, 
  (
    select 
      max(m2.map_version) 
    from 
      pf_public.pf_maps m2 
    where 
      m2.dataset_id = insert_map_with_a_new_mid_value_method.dataset_id
  ),
  m.data_labels,
  insert_map_with_a_new_mid_value_method.method_used_for_mid
from 
  pf_public.pf_maps m
where 
  m.dataset_id = insert_map_with_a_new_mid_value_method.dataset_id and m.is_latest is true limit 1;

return true;
end;
$$;


--
-- Name: FUNCTION insert_map_with_a_new_mid_value_method(dataset_id integer, map_style_id character varying, method_used_for_mid text); Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON FUNCTION pf_public.insert_map_with_a_new_mid_value_method(dataset_id integer, map_style_id character varying, method_used_for_mid text) IS 'Insert a new map to the pf_public.pf_maps table. All params `dataset_id`, `map_style_id` and `method_used_for_mid` are required by this function. 
Creates a new record by specifying the `method_used_for_mid` param: This will be used to create multiple copies of the same dataset but with different values of `method_used_for_mid`,
eg. mean and median.';


--
-- Name: insert_new_version_of_an_existing_map(integer, character varying, integer); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.insert_new_version_of_an_existing_map(dataset_id integer, map_style_id character varying, map_version integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ 
begin 
insert into pf_public.pf_maps (
  dataset_id, map_style_id, name, description, 
  stops, bin_hex_colors, status, "order", 
  is_diff, step, 
  binning_type, bin_labels, slug, 
  is_latest, map_version, data_labels,
  method_used_for_mid
) 
select 
  m.dataset_id, 
  insert_new_version_of_an_existing_map.map_style_id, 
  m.name, 
  m.description, 
  m.stops, 
  m.bin_hex_colors, 
  m.status,
  m."order", 
  m.is_diff, 
  m.step, 
  m.binning_type, 
  m.bin_labels, 
  m.slug,
  true,
  -- if map_version is not passed to the function, set it to the last version + 1 
  coalesce(insert_new_version_of_an_existing_map.map_version, (
    select 
      max(m2.map_version) + 1 
    from 
      pf_public.pf_maps m2 
    where 
      m2.dataset_id = insert_new_version_of_an_existing_map.dataset_id
  )),
  m.data_labels,
  m.method_used_for_mid
from 
  pf_public.pf_maps m
where 
  m.dataset_id = insert_new_version_of_an_existing_map.dataset_id and m.is_latest is true limit 1;

update 
  pf_public.pf_maps m 
set 
  is_latest = false 
where 
  m.dataset_id = insert_new_version_of_an_existing_map.dataset_id and m.map_style_id != insert_new_version_of_an_existing_map.map_style_id;

return true;
end;
$$;


--
-- Name: FUNCTION insert_new_version_of_an_existing_map(dataset_id integer, map_style_id character varying, map_version integer); Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON FUNCTION pf_public.insert_new_version_of_an_existing_map(dataset_id integer, map_style_id character varying, map_version integer) IS 'Insert a new map to the pf_public.pf_maps table. `dataset_id` and `map_style_id` are required by this function. The new record will be created 
with the same attributes of the old one. However, the new record will be the latest and its version will be set to the previous version plus one unless it is specified in the params.';


--
-- Name: pf_audit_table_delete_old_rows(); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.pf_audit_table_delete_old_rows() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  delete from pf_private.pf_audit
  where created_at < NOW() - INTERVAL '180 days';
  return null;
end;
$$;


--
-- Name: pf_update_user_access_request(uuid, boolean, text, boolean); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, rejected boolean) RETURNS boolean
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    AS $$
begin
  if not exists (select 1 from pf_private.pf_user_access_requests where pf_private.pf_user_access_requests.id = pf_update_user_access_request.id) then
    raise exception 'user % not found', pf_update_user_access_request.id;
  end if;
  update pf_private.pf_user_access_requests 
    set access_granted = pf_update_user_access_request.access_granted, note = pf_update_user_access_request.note,
      rejected = pf_update_user_access_request.rejected
        where pf_private.pf_user_access_requests.id = pf_update_user_access_request.id;
  return true;
end;
$$;


--
-- Name: project_share(uuid); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.project_share(slug_id uuid) RETURNS pf_public.project_share_response
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    AS $$
declare
  _partner_project_share pf_private.pf_partner_project_shares;
  _response pf_public.project_share_response;
begin
  select
    * into _partner_project_share
  from
    pf_private.pf_partner_project_shares
  where
    id = slug_id;
  if _partner_project_share is null then
    raise exception 'SlugId % not found', slug_id;
  end if;
  if now() > _partner_project_share.expires_at then
    raise exception 'Link is expired';
  end if;
  select
    map_config,
    pf_dataset_id into _response.map_config,
    _response.pf_dataset_id
  from
    pf_private.pf_partner_projects
  where
    id = _partner_project_share.project_id;
  with rows as (
    select
      pdu.id as upload_id,
      pdu.partner_dataset_id,
      pdu.original_file,
      pde.enriched_dataset_file,
      pdu.processed_with_coordinates_file,
      pdu.enrich,
      pde.pf_dataset_id,
      pd.name as dataset_name,
      pde.created_at as enrichment_created_at,
      pde.created_at as enrichment_updated_at
    from
      pf_private.pf_partner_project_datasets ppd
      join pf_private.pf_partner_datasets pd on ppd.dataset_id = pd.id
      join pf_private.pf_partner_dataset_uploads pdu on pdu.partner_dataset_id = ppd.dataset_id
      left join pf_private.pf_partner_dataset_enrichments pde on pdu.id = pde.upload_id
        and ppd.dataset_id = pde.partner_dataset_id
    where
      ppd.project_id = _partner_project_share.project_id
    order by
      ppd.created_at, pde.created_at
)
  select
    jsonb_agg(jsonb_build_object('upload_id', upload_id, 'partner_dataset_id', partner_dataset_id, 'original_file', 
      original_file, 'enriched_dataset_file', enriched_dataset_file, 'processed_with_coordinates_file',
      processed_with_coordinates_file, 'enrich', enrich, 'pf_dataset_id', pf_dataset_id, 'name', dataset_name,
      'enrichment_created_at', enrichment_created_at, 'enrichment_updated_at', enrichment_updated_at))
  into _response.project_datasets
  from
    rows;
  return _response;
end;
$$;


--
-- Name: update_partner_dataset(text, uuid); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.update_partner_dataset(dataset_name text, dataset_id uuid) RETURNS pf_private.pf_partner_datasets
    LANGUAGE sql
    AS $$
  update
    pf_private.pf_partner_datasets
  set
    name = dataset_name
  where
    id = dataset_id
  returning
    *;

$$;


--
-- Name: update_partner_project(uuid, jsonb, text, integer, text); Type: FUNCTION; Schema: pf_public; Owner: -
--

CREATE FUNCTION pf_public.update_partner_project(project_id uuid, map_config jsonb DEFAULT NULL::jsonb, image_url text DEFAULT NULL::text, pf_dataset_id integer DEFAULT NULL::integer, project_name text DEFAULT NULL::text) RETURNS pf_private.pf_partner_projects
    LANGUAGE sql
    AS $$
  update
    pf_private.pf_partner_projects
  set
    map_config = coalesce(update_partner_project.map_config, map_config),
    image_url = coalesce(update_partner_project.image_url, image_url),
    pf_dataset_id = coalesce(update_partner_project.pf_dataset_id, pf_dataset_id),
    name = coalesce(update_partner_project.project_name, name)
  where
    id = project_id
  returning
    *;

$$;


--
-- Name: pf_dataset_statistics; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_dataset_statistics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dataset_id integer NOT NULL,
    coordinate_hash text NOT NULL,
    warming_scenario text NOT NULL,
    low_value numeric(6,1),
    mid_value numeric(6,1),
    high_value numeric(6,1),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    x numeric[],
    y numeric[]
);


--
-- Name: TABLE pf_dataset_statistics; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TABLE pf_public.pf_dataset_statistics IS 'Normalized climate statistics for Probable Futures climate data';


--
-- Name: COLUMN pf_dataset_statistics.coordinate_hash; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON COLUMN pf_public.pf_dataset_statistics.coordinate_hash IS 'Md5 hash of the dataset grid + EWTK of the coordinate point. Used for inserting statistics without looking up a coordinate id';


--
-- Name: aggregate_pf_dataset_statistics; Type: VIEW; Schema: pf_private; Owner: -
--

CREATE VIEW pf_private.aggregate_pf_dataset_statistics AS
 SELECT pf_dataset_statistics.coordinate_hash,
    pf_dataset_statistics.dataset_id,
    unnest(array_agg(pf_dataset_statistics.low_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '0.5'::text))) AS data_baseline_low,
    unnest(array_agg(pf_dataset_statistics.mid_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '0.5'::text))) AS data_baseline_mid,
    unnest(array_agg(pf_dataset_statistics.high_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '0.5'::text))) AS data_baseline_high,
    unnest(array_agg(pf_dataset_statistics.low_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '1.0'::text))) AS data_1c_low,
    unnest(array_agg(pf_dataset_statistics.mid_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '1.0'::text))) AS data_1c_mid,
    unnest(array_agg(pf_dataset_statistics.high_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '1.0'::text))) AS data_1c_high,
    unnest(array_agg(pf_dataset_statistics.low_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '1.5'::text))) AS data_1_5c_low,
    unnest(array_agg(pf_dataset_statistics.mid_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '1.5'::text))) AS data_1_5c_mid,
    unnest(array_agg(pf_dataset_statistics.high_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '1.5'::text))) AS data_1_5c_high,
    unnest(array_agg(pf_dataset_statistics.low_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '2.0'::text))) AS data_2c_low,
    unnest(array_agg(pf_dataset_statistics.mid_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '2.0'::text))) AS data_2c_mid,
    unnest(array_agg(pf_dataset_statistics.high_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '2.0'::text))) AS data_2c_high,
    unnest(array_agg(pf_dataset_statistics.low_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '2.5'::text))) AS data_2_5c_low,
    unnest(array_agg(pf_dataset_statistics.mid_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '2.5'::text))) AS data_2_5c_mid,
    unnest(array_agg(pf_dataset_statistics.high_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '2.5'::text))) AS data_2_5c_high,
    unnest(array_agg(pf_dataset_statistics.low_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '3.0'::text))) AS data_3c_low,
    unnest(array_agg(pf_dataset_statistics.mid_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '3.0'::text))) AS data_3c_mid,
    unnest(array_agg(pf_dataset_statistics.high_value) FILTER (WHERE (pf_dataset_statistics.warming_scenario = '3.0'::text))) AS data_3c_high
   FROM pf_public.pf_dataset_statistics
  GROUP BY pf_dataset_statistics.coordinate_hash, pf_dataset_statistics.dataset_id;


--
-- Name: pf_grid_coordinates; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_grid_coordinates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    md5_hash text GENERATED ALWAYS AS (md5((grid || public.st_asewkt(point)))) STORED,
    grid text NOT NULL,
    point public.geography(Point,4326) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cell public.geography(Polygon,4326)
);


--
-- Name: TABLE pf_grid_coordinates; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TABLE pf_public.pf_grid_coordinates IS 'Dataset coordinates contains the geographic data for coordinates in particular model grids.
    Datasets with different model sources but the same model grid will share the same coordintes';


--
-- Name: COLUMN pf_grid_coordinates.md5_hash; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON COLUMN pf_public.pf_grid_coordinates.md5_hash IS 'MD5 Hash of the EWKT of the coordinate point, used as a FK for raw and statistical data';


--
-- Name: aggregate_pf_dataset_statistic_cells; Type: VIEW; Schema: pf_private; Owner: -
--

CREATE VIEW pf_private.aggregate_pf_dataset_statistic_cells AS
 SELECT coords.cell,
    stats.coordinate_hash,
    stats.dataset_id,
    stats.data_baseline_low,
    stats.data_baseline_mid,
    stats.data_baseline_high,
    stats.data_1c_low,
    stats.data_1c_mid,
    stats.data_1c_high,
    stats.data_1_5c_low,
    stats.data_1_5c_mid,
    stats.data_1_5c_high,
    stats.data_2c_low,
    stats.data_2c_mid,
    stats.data_2c_high,
    stats.data_2_5c_low,
    stats.data_2_5c_mid,
    stats.data_2_5c_high,
    stats.data_3c_low,
    stats.data_3c_mid,
    stats.data_3c_high
   FROM (pf_private.aggregate_pf_dataset_statistics stats
     JOIN pf_public.pf_grid_coordinates coords ON ((stats.coordinate_hash = coords.md5_hash)));


--
-- Name: connect_pg_simple_sessions; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.connect_pg_simple_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: TABLE connect_pg_simple_sessions; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON TABLE pf_private.connect_pg_simple_sessions IS 'User session storage for authentication';


--
-- Name: pf_audit; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action_type text,
    payload jsonb,
    user_sub text,
    user_ip text,
    rate_limit_threshold integer,
    message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pf_partner_dataset_coordinates; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_partner_dataset_coordinates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_dataset_id uuid NOT NULL,
    partner_dataset_row_id uuid NOT NULL,
    coordinates public.geography(Point,4326) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    pf_rcm_coordinate_hash text,
    pf_gcm_coordinate_hash text
);


--
-- Name: TABLE pf_partner_dataset_coordinates; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON TABLE pf_private.pf_partner_dataset_coordinates IS 'This table saves partner dataset row ids and their coordinates for performing spatial queries against PF dataset coordinates';


--
-- Name: pf_partner_enrichment_statuses; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_partner_enrichment_statuses (
    status text NOT NULL
);


--
-- Name: TABLE pf_partner_enrichment_statuses; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON TABLE pf_private.pf_partner_enrichment_statuses IS '@enum
@enumName EnrichmentStatus';


--
-- Name: pf_user_access_requests; Type: TABLE; Schema: pf_private; Owner: -
--

CREATE TABLE pf_private.pf_user_access_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_name text NOT NULL,
    email text NOT NULL,
    form_fields jsonb NOT NULL,
    access_granted boolean DEFAULT false,
    rejected boolean DEFAULT false,
    note text,
    create_by_user_sub text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: countries; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.countries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    iso_a2 character varying,
    iso_a3 character varying,
    wkb_geometry public.geometry(MultiPolygon,4326) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pf_dataset_model_grids; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_dataset_model_grids (
    grid text NOT NULL,
    resolution text
);


--
-- Name: TABLE pf_dataset_model_grids; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TABLE pf_public.pf_dataset_model_grids IS 'Model grids are used for referencing common grids shared by multiple dataset models';


--
-- Name: COLUMN pf_dataset_model_grids.resolution; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON COLUMN pf_public.pf_dataset_model_grids.resolution IS 'Model grid resolution describes the number of grid cells and the area covered by an individual cell.
    The two numbers before the "&" describes the number of unique X & Y coordinates.
    The numbers after the "&" describes the size in kilometers of a grid cell.
    e.g. "1800,901&22,22" is a grid with 1800 x points 901 y points and grid cells of 22 x 22 km.';


--
-- Name: pf_dataset_model_sources; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_dataset_model_sources (
    model text NOT NULL,
    grid text NOT NULL
);


--
-- Name: TABLE pf_dataset_model_sources; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TABLE pf_public.pf_dataset_model_sources IS 'Model sources reference the original climate models which were used to produce the Probable Futures datasets.';


--
-- Name: pf_dataset_parent_categories; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_dataset_parent_categories (
    name text NOT NULL,
    label text
);


--
-- Name: pf_dataset_sub_categories; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_dataset_sub_categories (
    name text NOT NULL,
    parent_category public.citext NOT NULL
);


--
-- Name: pf_dataset_units; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_dataset_units (
    unit text NOT NULL,
    unit_long text
);


--
-- Name: TABLE pf_dataset_units; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TABLE pf_public.pf_dataset_units IS 'Valid unit names for Probable Futures datasets';


--
-- Name: pf_datasets; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_datasets (
    id integer NOT NULL,
    slug public.citext NOT NULL,
    name text NOT NULL,
    description text,
    model text,
    unit public.citext,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    min_value real DEFAULT 0,
    max_value real DEFAULT 0,
    parent_category text,
    sub_category text,
    data_variables text[]
);


--
-- Name: TABLE pf_datasets; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TABLE pf_public.pf_datasets IS 'Metadata for Probable Futures datasets';


--
-- Name: pf_map_statuses; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_map_statuses (
    status text NOT NULL
);


--
-- Name: TABLE pf_map_statuses; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TABLE pf_public.pf_map_statuses IS 'Valid state of map publishing statuses';


--
-- Name: pf_maps; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_maps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dataset_id integer NOT NULL,
    map_style_id character varying(50),
    name text NOT NULL,
    description text,
    stops real[],
    bin_hex_colors pf_public.hex_color[],
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "order" integer,
    is_diff boolean DEFAULT false,
    step real DEFAULT 1,
    binning_type text DEFAULT 'range'::text NOT NULL,
    bin_labels text[],
    slug public.citext,
    map_version integer,
    is_latest boolean DEFAULT false,
    data_labels text[] DEFAULT '{"5th percentile",average,"95th percentile"}'::text[],
    method_used_for_mid text DEFAULT 'mean'::text
);


--
-- Name: TABLE pf_maps; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TABLE pf_public.pf_maps IS 'Relates a dataset to a map style stored in Mapbox';


--
-- Name: pf_statistical_variable_names; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_statistical_variable_names (
    slug public.citext NOT NULL,
    name text,
    dataset_id integer,
    description text
);


--
-- Name: TABLE pf_statistical_variable_names; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TABLE pf_public.pf_statistical_variable_names IS 'Table storing variable names across datasets';


--
-- Name: pf_warming_scenarios; Type: TABLE; Schema: pf_public; Owner: -
--

CREATE TABLE pf_public.pf_warming_scenarios (
    slug text NOT NULL,
    name text,
    description text
);


--
-- Name: TABLE pf_warming_scenarios; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TABLE pf_public.pf_warming_scenarios IS 'Warming scenarios forecasted in Probable Futures dataset statistics';


--
-- Name: view_partner_dataset_enrichments; Type: VIEW; Schema: pf_public; Owner: -
--

CREATE VIEW pf_public.view_partner_dataset_enrichments AS
 SELECT pf_partner_dataset_enrichments.id,
    pf_partner_dataset_enrichments.status,
    pf_partner_dataset_enrichments.upload_id,
    pf_partner_dataset_enrichments.enrichment_errors,
    pf_partner_dataset_enrichments.enrichment_time_ms AS enriched_row_count,
    pf_partner_dataset_enrichments.enriched_dataset_file,
    pf_partner_dataset_enrichments.pf_dataset_id,
    pf_partner_dataset_enrichments.project_id
   FROM pf_private.pf_partner_dataset_enrichments
  WHERE (pf_partner_dataset_enrichments.partner_id = (pf_public."current_user"()).id);


--
-- Name: VIEW view_partner_dataset_enrichments; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON VIEW pf_public.view_partner_dataset_enrichments IS '@primaryKey id
@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)
';


--
-- Name: COLUMN view_partner_dataset_enrichments.status; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON COLUMN pf_public.view_partner_dataset_enrichments.status IS '@notNull';


--
-- Name: view_partner_dataset_uploads; Type: VIEW; Schema: pf_public; Owner: -
--

CREATE VIEW pf_public.view_partner_dataset_uploads AS
 SELECT pdu.id,
    pdu.partner_dataset_id,
    pdu.original_file,
    pdu.processed_file,
    pdu.created_at,
    pdu.updated_at,
    pdu.partner_id,
    pdu.csv_headers,
    pdu.processed_row_count,
    pdu.processing_errors,
    pdu.processing_time_ms,
    pdu.processed_with_coordinates_file,
    pdu.processed_with_coordinates_row_count,
    pdu.processing_with_coordinates_errors,
    pdu.processing_with_coordinates_time_ms,
    pdu.geodata_type,
    pdu.enrich,
    pdu.status
   FROM (pf_private.pf_partner_dataset_uploads pdu
     JOIN pf_private.pf_partner_datasets pd ON ((pd.id = pdu.partner_dataset_id)))
  WHERE ((pdu.partner_id = (pf_public."current_user"()).id) OR (pd.is_example = true));


--
-- Name: VIEW view_partner_dataset_uploads; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON VIEW pf_public.view_partner_dataset_uploads IS '@primaryKey id
@foreignKey (partner_dataset_id) references pf_private.pf_partner_datasets (id)
@foreignKey (partner_dataset_id) references pf_private.pf_partner_datasets (id)';


--
-- Name: COLUMN view_partner_dataset_uploads.original_file; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON COLUMN pf_public.view_partner_dataset_uploads.original_file IS '@notNull';


--
-- Name: view_partner_datasets; Type: VIEW; Schema: pf_public; Owner: -
--

CREATE VIEW pf_public.view_partner_datasets AS
 SELECT pd.id,
    pd.name,
    pd.description,
    pd.created_at,
    pd.updated_at,
    pd.is_example,
    pdu.original_file,
    pdu.processed_with_coordinates_file,
    pdu.id AS upload_id
   FROM (pf_private.pf_partner_datasets pd
     JOIN pf_private.pf_partner_dataset_uploads pdu ON ((pd.id = pdu.partner_dataset_id)))
  WHERE ((pd.partner_id = (pf_public."current_user"()).id) OR (pd.is_example = true));


--
-- Name: VIEW view_partner_datasets; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON VIEW pf_public.view_partner_datasets IS '@primaryKey id
@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)';


--
-- Name: COLUMN view_partner_datasets.name; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON COLUMN pf_public.view_partner_datasets.name IS '@notNull';


--
-- Name: view_partner_project_datasets; Type: VIEW; Schema: pf_public; Owner: -
--

CREATE VIEW pf_public.view_partner_project_datasets AS
 SELECT pp.id AS project_id,
    pp.name AS project_name,
    pp.description AS project_description,
    pd.id AS dataset_id,
    pd.name AS dataset_name,
    pd.description AS dataset_description,
    pdu.id AS upload_id,
    pdu.original_file,
    pde.enriched_dataset_file,
    pdu.processed_with_coordinates_file,
    pdu.enrich,
    pdu.processed_with_coordinates_row_count,
    pdu.status AS processing_status,
    pde.status AS enrichment_status,
    pde.pf_dataset_id,
    pde.id AS enriched_dataset_id,
    pd.is_example,
    pde.created_at AS enrichment_created_at,
    pde.created_at AS enrichment_updated_at
   FROM ((((pf_private.pf_partner_project_datasets ppd
     JOIN pf_private.pf_partner_projects pp ON ((pp.id = ppd.project_id)))
     JOIN pf_private.pf_partner_datasets pd ON ((pd.id = ppd.dataset_id)))
     JOIN pf_private.pf_partner_dataset_uploads pdu ON ((pd.id = pdu.partner_dataset_id)))
     LEFT JOIN pf_private.pf_partner_dataset_enrichments pde ON (((pdu.id = pde.upload_id) AND (pd.id = pde.partner_dataset_id))))
  WHERE (pp.partner_id = (pf_public."current_user"()).id)
  ORDER BY ppd.created_at, pde.created_at;


--
-- Name: VIEW view_partner_project_datasets; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON VIEW pf_public.view_partner_project_datasets IS '@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)
@foreignKey (project_id) references pf_private.pf_partner_projects (id)';


--
-- Name: COLUMN view_partner_project_datasets.project_name; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON COLUMN pf_public.view_partner_project_datasets.project_name IS '@notNull';


--
-- Name: COLUMN view_partner_project_datasets.dataset_name; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON COLUMN pf_public.view_partner_project_datasets.dataset_name IS '@notNull';


--
-- Name: view_partner_projects; Type: VIEW; Schema: pf_public; Owner: -
--

CREATE VIEW pf_public.view_partner_projects AS
 SELECT pf_partner_projects.id,
    pf_partner_projects.name,
    pf_partner_projects.description,
    pf_partner_projects.map_config,
    pf_partner_projects.created_at,
    pf_partner_projects.updated_at,
    pf_partner_projects.image_url,
    pf_partner_projects.pf_dataset_id
   FROM pf_private.pf_partner_projects
  WHERE (pf_partner_projects.partner_id = (pf_public."current_user"()).id);


--
-- Name: VIEW view_partner_projects; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON VIEW pf_public.view_partner_projects IS '@primaryKey id';


--
-- Name: COLUMN view_partner_projects.name; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON COLUMN pf_public.view_partner_projects.name IS '@notNull';


--
-- Name: COLUMN view_partner_projects.created_at; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON COLUMN pf_public.view_partner_projects.created_at IS '@notNull';


--
-- Name: view_pf_country_statistics; Type: VIEW; Schema: pf_public; Owner: -
--

CREATE VIEW pf_public.view_pf_country_statistics AS
 SELECT pf_country_statistics.id,
    pf_country_statistics.dataset_id,
    pf_country_statistics.country_id,
    pf_country_statistics.file_url,
    pf_country_statistics.status
   FROM pf_private.pf_country_statistics;


--
-- Name: view_user_access_request; Type: VIEW; Schema: pf_public; Owner: -
--

CREATE VIEW pf_public.view_user_access_request AS
 SELECT pf_user_access_requests.id,
    pf_user_access_requests.form_name,
    pf_user_access_requests.email,
    pf_user_access_requests.form_fields,
    pf_user_access_requests.access_granted,
    pf_user_access_requests.rejected,
    pf_user_access_requests.note
   FROM pf_private.pf_user_access_requests;


--
-- Name: pf_country_statistics pf_country_statistics_pkey; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_country_statistics
    ADD CONSTRAINT pf_country_statistics_pkey PRIMARY KEY (id);


--
-- Name: pf_partner_dataset_coordinates pf_partner_dataset_coordinate_partner_dataset_id_partner_da_key; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_coordinates
    ADD CONSTRAINT pf_partner_dataset_coordinate_partner_dataset_id_partner_da_key UNIQUE (partner_dataset_id, partner_dataset_row_id);


--
-- Name: pf_partner_dataset_coordinates pf_partner_dataset_coordinates_pkey; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_coordinates
    ADD CONSTRAINT pf_partner_dataset_coordinates_pkey PRIMARY KEY (id);


--
-- Name: pf_partner_dataset_enrichments pf_partner_dataset_enrichments_pkey; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_enrichments
    ADD CONSTRAINT pf_partner_dataset_enrichments_pkey PRIMARY KEY (id);


--
-- Name: pf_partner_dataset_uploads pf_partner_dataset_uploads_pkey; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_uploads
    ADD CONSTRAINT pf_partner_dataset_uploads_pkey PRIMARY KEY (id);


--
-- Name: pf_partner_datasets pf_partner_datasets_pkey; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_datasets
    ADD CONSTRAINT pf_partner_datasets_pkey PRIMARY KEY (id);


--
-- Name: pf_partner_enrichment_statuses pf_partner_enrichment_statuses_pkey; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_enrichment_statuses
    ADD CONSTRAINT pf_partner_enrichment_statuses_pkey PRIMARY KEY (status);


--
-- Name: pf_partner_project_shares pf_partner_project_shares_pkey; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_project_shares
    ADD CONSTRAINT pf_partner_project_shares_pkey PRIMARY KEY (id);


--
-- Name: pf_partner_projects pf_partner_projects_pkey; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_projects
    ADD CONSTRAINT pf_partner_projects_pkey PRIMARY KEY (id);


--
-- Name: pf_users pf_users_pkey; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_users
    ADD CONSTRAINT pf_users_pkey PRIMARY KEY (id);


--
-- Name: pf_users pf_users_sub_key; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_users
    ADD CONSTRAINT pf_users_sub_key UNIQUE (sub);


--
-- Name: connect_pg_simple_sessions session_pkey; Type: CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.connect_pg_simple_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: countries countries_name_unique; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.countries
    ADD CONSTRAINT countries_name_unique UNIQUE (name);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: pf_dataset_model_grids pf_dataset_model_grids_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_model_grids
    ADD CONSTRAINT pf_dataset_model_grids_pkey PRIMARY KEY (grid);


--
-- Name: pf_dataset_model_grids pf_dataset_model_grids_resolution_key; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_model_grids
    ADD CONSTRAINT pf_dataset_model_grids_resolution_key UNIQUE (resolution);


--
-- Name: pf_dataset_model_sources pf_dataset_model_sources_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_model_sources
    ADD CONSTRAINT pf_dataset_model_sources_pkey PRIMARY KEY (model);


--
-- Name: pf_dataset_parent_categories pf_dataset_parent_categories_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_parent_categories
    ADD CONSTRAINT pf_dataset_parent_categories_pkey PRIMARY KEY (name);


--
-- Name: pf_dataset_statistics pf_dataset_statistics_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_statistics
    ADD CONSTRAINT pf_dataset_statistics_pkey PRIMARY KEY (id);


--
-- Name: pf_dataset_sub_categories pf_dataset_sub_categories_name_parent_category_key; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_sub_categories
    ADD CONSTRAINT pf_dataset_sub_categories_name_parent_category_key UNIQUE (name, parent_category);


--
-- Name: pf_dataset_sub_categories pf_dataset_sub_categories_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_sub_categories
    ADD CONSTRAINT pf_dataset_sub_categories_pkey PRIMARY KEY (name);


--
-- Name: pf_dataset_units pf_dataset_units_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_units
    ADD CONSTRAINT pf_dataset_units_pkey PRIMARY KEY (unit);


--
-- Name: pf_datasets pf_datasets_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_datasets
    ADD CONSTRAINT pf_datasets_pkey PRIMARY KEY (id);


--
-- Name: pf_datasets pf_datasets_slug_key; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_datasets
    ADD CONSTRAINT pf_datasets_slug_key UNIQUE (slug);


--
-- Name: pf_grid_coordinates pf_grid_coordinates_md5_hash_key; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_grid_coordinates
    ADD CONSTRAINT pf_grid_coordinates_md5_hash_key UNIQUE (md5_hash);


--
-- Name: pf_grid_coordinates pf_grid_coordinates_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_grid_coordinates
    ADD CONSTRAINT pf_grid_coordinates_pkey PRIMARY KEY (id);


--
-- Name: pf_map_statuses pf_map_statuses_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_map_statuses
    ADD CONSTRAINT pf_map_statuses_pkey PRIMARY KEY (status);


--
-- Name: pf_maps pf_maps_map_style_id_key; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_maps
    ADD CONSTRAINT pf_maps_map_style_id_key UNIQUE (map_style_id);


--
-- Name: pf_maps pf_maps_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_maps
    ADD CONSTRAINT pf_maps_pkey PRIMARY KEY (id);


--
-- Name: pf_statistical_variable_names pf_statistical_variable_names_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_statistical_variable_names
    ADD CONSTRAINT pf_statistical_variable_names_pkey PRIMARY KEY (slug);


--
-- Name: pf_warming_scenarios pf_warming_scenarios_pkey; Type: CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_warming_scenarios
    ADD CONSTRAINT pf_warming_scenarios_pkey PRIMARY KEY (slug);


--
-- Name: idx_connect_pg_simple_sessions_expire; Type: INDEX; Schema: pf_private; Owner: -
--

CREATE INDEX idx_connect_pg_simple_sessions_expire ON pf_private.connect_pg_simple_sessions USING btree (expire);


--
-- Name: idx_partner_dataset_partner_id; Type: INDEX; Schema: pf_private; Owner: -
--

CREATE INDEX idx_partner_dataset_partner_id ON pf_private.pf_partner_datasets USING btree (partner_id);


--
-- Name: idx_partner_dataset_uploads_partner_id; Type: INDEX; Schema: pf_private; Owner: -
--

CREATE INDEX idx_partner_dataset_uploads_partner_id ON pf_private.pf_partner_dataset_uploads USING btree (partner_id);


--
-- Name: idx_partner_enrichments_partner_id; Type: INDEX; Schema: pf_private; Owner: -
--

CREATE INDEX idx_partner_enrichments_partner_id ON pf_private.pf_partner_dataset_enrichments USING btree (partner_id);


--
-- Name: idx_partner_enrichments_project_id; Type: INDEX; Schema: pf_private; Owner: -
--

CREATE INDEX idx_partner_enrichments_project_id ON pf_private.pf_partner_dataset_enrichments USING btree (project_id);


--
-- Name: idx_partner_enrichments_upload_id; Type: INDEX; Schema: pf_private; Owner: -
--

CREATE INDEX idx_partner_enrichments_upload_id ON pf_private.pf_partner_dataset_enrichments USING btree (upload_id);


--
-- Name: idx_partner_projects_partner_id; Type: INDEX; Schema: pf_private; Owner: -
--

CREATE INDEX idx_partner_projects_partner_id ON pf_private.pf_partner_projects USING btree (partner_id);


--
-- Name: partner_dataset_id_idx; Type: INDEX; Schema: pf_private; Owner: -
--

CREATE INDEX partner_dataset_id_idx ON pf_private.pf_partner_dataset_coordinates USING btree (partner_dataset_id);


--
-- Name: pf_dataset_id_idx; Type: INDEX; Schema: pf_private; Owner: -
--

CREATE INDEX pf_dataset_id_idx ON pf_private.pf_partner_dataset_enrichments USING btree (pf_dataset_id);


--
-- Name: pf_partner_dataset_coordinates_idx; Type: INDEX; Schema: pf_private; Owner: -
--

CREATE INDEX pf_partner_dataset_coordinates_idx ON pf_private.pf_partner_dataset_coordinates USING gist (coordinates);


--
-- Name: INDEX pf_partner_dataset_coordinates_idx; Type: COMMENT; Schema: pf_private; Owner: -
--

COMMENT ON INDEX pf_private.pf_partner_dataset_coordinates_idx IS 'This GiST index is necessary for speeding up spatial queries';


--
-- Name: pf_countries_wkb_geometry_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_countries_wkb_geometry_idx ON pf_public.countries USING gist (wkb_geometry);


--
-- Name: pf_dataset_model_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_dataset_model_idx ON pf_public.pf_datasets USING btree (model);


--
-- Name: pf_dataset_slug_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_dataset_slug_idx ON pf_public.pf_datasets USING btree (slug);


--
-- Name: pf_dataset_stats_coordinate_hash_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_dataset_stats_coordinate_hash_idx ON pf_public.pf_dataset_statistics USING hash (coordinate_hash);


--
-- Name: pf_dataset_stats_dataset_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_dataset_stats_dataset_idx ON pf_public.pf_dataset_statistics USING btree (dataset_id);


--
-- Name: pf_dataset_stats_warming_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_dataset_stats_warming_idx ON pf_public.pf_dataset_statistics USING btree (warming_scenario);


--
-- Name: pf_dataset_unit_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_dataset_unit_idx ON pf_public.pf_datasets USING btree (unit);


--
-- Name: pf_grid_coordinate_cell_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_grid_coordinate_cell_idx ON pf_public.pf_grid_coordinates USING gist (cell);


--
-- Name: pf_grid_coordinate_grid_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_grid_coordinate_grid_idx ON pf_public.pf_grid_coordinates USING btree (grid);


--
-- Name: pf_grid_coordinate_point_hash_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_grid_coordinate_point_hash_idx ON pf_public.pf_grid_coordinates USING hash (md5_hash);


--
-- Name: pf_grid_coordinate_point_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_grid_coordinate_point_idx ON pf_public.pf_grid_coordinates USING gist (point);


--
-- Name: INDEX pf_grid_coordinate_point_idx; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON INDEX pf_public.pf_grid_coordinate_point_idx IS 'This GiST index is necessary for speeding up spatial queries';


--
-- Name: pf_map_dataset_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_map_dataset_idx ON pf_public.pf_maps USING btree (dataset_id);


--
-- Name: pf_map_order_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_map_order_idx ON pf_public.pf_maps USING btree ("order");


--
-- Name: pf_map_status_idx; Type: INDEX; Schema: pf_public; Owner: -
--

CREATE INDEX pf_map_status_idx ON pf_public.pf_maps USING btree (status);


--
-- Name: pf_audit _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_audit FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_country_statistics _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_country_statistics FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_partner_dataset_coordinates _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_partner_dataset_coordinates FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_partner_dataset_enrichments _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_partner_dataset_enrichments FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_partner_dataset_uploads _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_partner_dataset_uploads FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_partner_datasets _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_partner_datasets FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_partner_project_datasets _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_partner_project_datasets FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_partner_project_shares _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_partner_project_shares FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_partner_projects _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_partner_projects FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_user_access_requests _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_user_access_requests FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_users _100_timestamps; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_private.pf_users FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_country_statistics _500_create_statistics_file; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _500_create_statistics_file BEFORE INSERT ON pf_private.pf_country_statistics FOR EACH ROW EXECUTE FUNCTION pf_private.create_statistics_file();


--
-- Name: pf_partner_datasets _500_delete_partner_dataset_files; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _500_delete_partner_dataset_files BEFORE DELETE ON pf_private.pf_partner_datasets FOR EACH ROW EXECUTE FUNCTION pf_private.delete_partner_dataset_files();


--
-- Name: pf_partner_dataset_enrichments _500_upload; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _500_upload AFTER INSERT ON pf_private.pf_partner_dataset_enrichments FOR EACH ROW EXECUTE FUNCTION pf_private.enrich_partner_dataset();


--
-- Name: pf_partner_dataset_uploads _500_upload; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER _500_upload AFTER INSERT ON pf_private.pf_partner_dataset_uploads FOR EACH ROW EXECUTE FUNCTION pf_private.process_partner_dataset_upload();


--
-- Name: pf_audit __500_pf_audit_table_delete_old_rows; Type: TRIGGER; Schema: pf_private; Owner: -
--

CREATE TRIGGER __500_pf_audit_table_delete_old_rows AFTER INSERT ON pf_private.pf_audit FOR EACH ROW EXECUTE FUNCTION pf_public.pf_audit_table_delete_old_rows();


--
-- Name: pf_dataset_statistics _100_timestamps; Type: TRIGGER; Schema: pf_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_public.pf_dataset_statistics FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_datasets _100_timestamps; Type: TRIGGER; Schema: pf_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_public.pf_datasets FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_grid_coordinates _100_timestamps; Type: TRIGGER; Schema: pf_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_public.pf_grid_coordinates FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_maps _100_timestamps; Type: TRIGGER; Schema: pf_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON pf_public.pf_maps FOR EACH ROW EXECUTE FUNCTION pf_private.tg__timestamps();


--
-- Name: pf_grid_coordinates _200_set_cell; Type: TRIGGER; Schema: pf_public; Owner: -
--

CREATE TRIGGER _200_set_cell BEFORE INSERT OR UPDATE ON pf_public.pf_grid_coordinates FOR EACH ROW EXECUTE FUNCTION pf_private.set_cell_from_model();


--
-- Name: TRIGGER _200_set_cell ON pf_grid_coordinates; Type: COMMENT; Schema: pf_public; Owner: -
--

COMMENT ON TRIGGER _200_set_cell ON pf_public.pf_grid_coordinates IS 'Set cell from point and based on the model';


--
-- Name: pf_country_statistics pf_country_statistics_countries_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_country_statistics
    ADD CONSTRAINT pf_country_statistics_countries_fkey FOREIGN KEY (country_id) REFERENCES pf_public.countries(id);


--
-- Name: pf_country_statistics pf_country_statistics_pf_datastes_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_country_statistics
    ADD CONSTRAINT pf_country_statistics_pf_datastes_fkey FOREIGN KEY (dataset_id) REFERENCES pf_public.pf_datasets(id);


--
-- Name: pf_partner_dataset_coordinates pf_partner_dataset_coordinates_partner_dataset_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_coordinates
    ADD CONSTRAINT pf_partner_dataset_coordinates_partner_dataset_id_fkey FOREIGN KEY (partner_dataset_id) REFERENCES pf_private.pf_partner_datasets(id) ON DELETE CASCADE;


--
-- Name: pf_partner_dataset_coordinates pf_partner_dataset_coordinates_pf_gcm_coordinate_hash_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_coordinates
    ADD CONSTRAINT pf_partner_dataset_coordinates_pf_gcm_coordinate_hash_fkey FOREIGN KEY (pf_gcm_coordinate_hash) REFERENCES pf_public.pf_grid_coordinates(md5_hash) ON UPDATE CASCADE;


--
-- Name: pf_partner_dataset_coordinates pf_partner_dataset_coordinates_pf_rcm_coordinate_hash_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_coordinates
    ADD CONSTRAINT pf_partner_dataset_coordinates_pf_rcm_coordinate_hash_fkey FOREIGN KEY (pf_rcm_coordinate_hash) REFERENCES pf_public.pf_grid_coordinates(md5_hash) ON UPDATE CASCADE;


--
-- Name: pf_partner_dataset_enrichments pf_partner_dataset_enrichments_partner_dataset_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_enrichments
    ADD CONSTRAINT pf_partner_dataset_enrichments_partner_dataset_id_fkey FOREIGN KEY (partner_dataset_id) REFERENCES pf_private.pf_partner_datasets(id) ON DELETE CASCADE;


--
-- Name: pf_partner_dataset_enrichments pf_partner_dataset_enrichments_partner_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_enrichments
    ADD CONSTRAINT pf_partner_dataset_enrichments_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES pf_private.pf_users(id) ON DELETE CASCADE;


--
-- Name: pf_partner_dataset_enrichments pf_partner_dataset_enrichments_pf_dataset_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_enrichments
    ADD CONSTRAINT pf_partner_dataset_enrichments_pf_dataset_id_fkey FOREIGN KEY (pf_dataset_id) REFERENCES pf_public.pf_datasets(id);


--
-- Name: pf_partner_dataset_enrichments pf_partner_dataset_enrichments_project_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_enrichments
    ADD CONSTRAINT pf_partner_dataset_enrichments_project_id_fkey FOREIGN KEY (project_id) REFERENCES pf_private.pf_partner_projects(id) ON DELETE CASCADE;


--
-- Name: pf_partner_dataset_enrichments pf_partner_dataset_enrichments_status_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_enrichments
    ADD CONSTRAINT pf_partner_dataset_enrichments_status_fkey FOREIGN KEY (status) REFERENCES pf_private.pf_partner_enrichment_statuses(status) ON UPDATE CASCADE;


--
-- Name: pf_partner_dataset_enrichments pf_partner_dataset_enrichments_upload_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_enrichments
    ADD CONSTRAINT pf_partner_dataset_enrichments_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES pf_private.pf_partner_dataset_uploads(id) ON DELETE CASCADE;


--
-- Name: pf_partner_dataset_uploads pf_partner_dataset_uploads_partner_dataset_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_uploads
    ADD CONSTRAINT pf_partner_dataset_uploads_partner_dataset_id_fkey FOREIGN KEY (partner_dataset_id) REFERENCES pf_private.pf_partner_datasets(id) ON DELETE CASCADE;


--
-- Name: pf_partner_dataset_uploads pf_partner_dataset_uploads_partner_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_dataset_uploads
    ADD CONSTRAINT pf_partner_dataset_uploads_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES pf_private.pf_users(id) ON DELETE CASCADE;


--
-- Name: pf_partner_datasets pf_partner_datasets_partner_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_datasets
    ADD CONSTRAINT pf_partner_datasets_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES pf_private.pf_users(id) ON DELETE CASCADE;


--
-- Name: pf_partner_project_datasets pf_partner_project_datasets_dataset_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_project_datasets
    ADD CONSTRAINT pf_partner_project_datasets_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES pf_private.pf_partner_datasets(id) ON DELETE CASCADE;


--
-- Name: pf_partner_project_datasets pf_partner_project_datasets_project_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_project_datasets
    ADD CONSTRAINT pf_partner_project_datasets_project_id_fkey FOREIGN KEY (project_id) REFERENCES pf_private.pf_partner_projects(id) ON DELETE CASCADE;


--
-- Name: pf_partner_project_shares pf_partner_project_shares_project_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_project_shares
    ADD CONSTRAINT pf_partner_project_shares_project_id_fkey FOREIGN KEY (project_id) REFERENCES pf_private.pf_partner_projects(id) ON DELETE CASCADE;


--
-- Name: pf_partner_projects pf_partner_projects_partner_id_fkey; Type: FK CONSTRAINT; Schema: pf_private; Owner: -
--

ALTER TABLE ONLY pf_private.pf_partner_projects
    ADD CONSTRAINT pf_partner_projects_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES pf_private.pf_users(id) ON DELETE CASCADE;


--
-- Name: pf_dataset_model_sources pf_dataset_model_sources_grid_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_model_sources
    ADD CONSTRAINT pf_dataset_model_sources_grid_fkey FOREIGN KEY (grid) REFERENCES pf_public.pf_dataset_model_grids(grid);


--
-- Name: pf_dataset_statistics pf_dataset_statistics_coordinate_hash_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_statistics
    ADD CONSTRAINT pf_dataset_statistics_coordinate_hash_fkey FOREIGN KEY (coordinate_hash) REFERENCES pf_public.pf_grid_coordinates(md5_hash) ON UPDATE CASCADE;


--
-- Name: pf_dataset_statistics pf_dataset_statistics_dataset_id_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_statistics
    ADD CONSTRAINT pf_dataset_statistics_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES pf_public.pf_datasets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pf_dataset_statistics pf_dataset_statistics_warming_scenario_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_statistics
    ADD CONSTRAINT pf_dataset_statistics_warming_scenario_fkey FOREIGN KEY (warming_scenario) REFERENCES pf_public.pf_warming_scenarios(slug) ON UPDATE CASCADE;


--
-- Name: pf_dataset_sub_categories pf_dataset_sub_categories_parent_category_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_dataset_sub_categories
    ADD CONSTRAINT pf_dataset_sub_categories_parent_category_fkey FOREIGN KEY (parent_category) REFERENCES pf_public.pf_dataset_parent_categories(name);


--
-- Name: pf_datasets pf_datasets_model_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_datasets
    ADD CONSTRAINT pf_datasets_model_fkey FOREIGN KEY (model) REFERENCES pf_public.pf_dataset_model_sources(model) ON UPDATE CASCADE;


--
-- Name: pf_datasets pf_datasets_parent_category_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_datasets
    ADD CONSTRAINT pf_datasets_parent_category_fkey FOREIGN KEY (parent_category) REFERENCES pf_public.pf_dataset_parent_categories(name);


--
-- Name: pf_datasets pf_datasets_sub_category_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_datasets
    ADD CONSTRAINT pf_datasets_sub_category_fkey FOREIGN KEY (sub_category) REFERENCES pf_public.pf_dataset_sub_categories(name);


--
-- Name: pf_datasets pf_datasets_unit_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_datasets
    ADD CONSTRAINT pf_datasets_unit_fkey FOREIGN KEY (unit) REFERENCES pf_public.pf_dataset_units(unit) ON UPDATE CASCADE;


--
-- Name: pf_grid_coordinates pf_grid_coordinates_grid_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_grid_coordinates
    ADD CONSTRAINT pf_grid_coordinates_grid_fkey FOREIGN KEY (grid) REFERENCES pf_public.pf_dataset_model_grids(grid) ON UPDATE CASCADE;


--
-- Name: pf_maps pf_maps_dataset_id_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_maps
    ADD CONSTRAINT pf_maps_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES pf_public.pf_datasets(id);


--
-- Name: pf_maps pf_maps_status_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_maps
    ADD CONSTRAINT pf_maps_status_fkey FOREIGN KEY (status) REFERENCES pf_public.pf_map_statuses(status);


--
-- Name: pf_statistical_variable_names pf_statistical_variable_names_dataset_id_fkey; Type: FK CONSTRAINT; Schema: pf_public; Owner: -
--

ALTER TABLE ONLY pf_public.pf_statistical_variable_names
    ADD CONSTRAINT pf_statistical_variable_names_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES pf_public.pf_datasets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: connect_pg_simple_sessions; Type: ROW SECURITY; Schema: pf_private; Owner: -
--

ALTER TABLE pf_private.connect_pg_simple_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: pf_partner_dataset_enrichments; Type: ROW SECURITY; Schema: pf_private; Owner: -
--

ALTER TABLE pf_private.pf_partner_dataset_enrichments ENABLE ROW LEVEL SECURITY;

--
-- Name: pf_partner_dataset_uploads; Type: ROW SECURITY; Schema: pf_private; Owner: -
--

ALTER TABLE pf_private.pf_partner_dataset_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: pf_partner_datasets; Type: ROW SECURITY; Schema: pf_private; Owner: -
--

ALTER TABLE pf_private.pf_partner_datasets ENABLE ROW LEVEL SECURITY;

--
-- Name: pf_partner_projects; Type: ROW SECURITY; Schema: pf_private; Owner: -
--

ALTER TABLE pf_private.pf_partner_projects ENABLE ROW LEVEL SECURITY;

--
-- Name: pf_users; Type: ROW SECURITY; Schema: pf_private; Owner: -
--

ALTER TABLE pf_private.pf_users ENABLE ROW LEVEL SECURITY;

--
-- Name: pf_partner_dataset_enrichments private_partner_dataset_enrichments; Type: POLICY; Schema: pf_private; Owner: -
--

CREATE POLICY private_partner_dataset_enrichments ON pf_private.pf_partner_dataset_enrichments TO pf_authenticated USING (((pf_public."current_user"()).id = partner_id)) WITH CHECK ((partner_id = (pf_public."current_user"()).id));


--
-- Name: pf_partner_datasets private_partner_datasets; Type: POLICY; Schema: pf_private; Owner: -
--

CREATE POLICY private_partner_datasets ON pf_private.pf_partner_datasets TO pf_authenticated USING (((pf_public."current_user"()).id = partner_id)) WITH CHECK ((partner_id = (pf_public."current_user"()).id));


--
-- Name: pf_partner_projects private_partner_projects; Type: POLICY; Schema: pf_private; Owner: -
--

CREATE POLICY private_partner_projects ON pf_private.pf_partner_projects TO pf_authenticated USING ((partner_id = (pf_public."current_user"()).id)) WITH CHECK ((partner_id = (pf_public."current_user"()).id));


--
-- Name: pf_partner_dataset_uploads private_partner_uploads; Type: POLICY; Schema: pf_private; Owner: -
--

CREATE POLICY private_partner_uploads ON pf_private.pf_partner_dataset_uploads TO pf_authenticated USING (((pf_public."current_user"()).id = partner_id)) WITH CHECK ((partner_id = (pf_public."current_user"()).id));


--
-- Name: pf_users update_self; Type: POLICY; Schema: pf_private; Owner: -
--

CREATE POLICY update_self ON pf_private.pf_users USING ((sub = pf_public.current_user_sub())) WITH CHECK ((sub = pf_public.current_user_sub()));


--
-- Name: SCHEMA pf_hidden; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA pf_hidden TO pf_anonymous;


--
-- Name: SCHEMA pf_private; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA pf_private TO pf_authenticated;
GRANT USAGE ON SCHEMA pf_private TO pf_partner;


--
-- Name: SCHEMA pf_public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA pf_public TO pf_anonymous;
GRANT USAGE ON SCHEMA pf_public TO pf_authenticated;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO pf_owner;
GRANT USAGE ON SCHEMA public TO pf_anonymous;


--
-- Name: TYPE dataset_statistics_response; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TYPE pf_public.dataset_statistics_response TO pf_root;


--
-- Name: TYPE hex_color; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TYPE pf_public.hex_color TO pf_root;


--
-- Name: TYPE project_share_response; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TYPE pf_public.project_share_response TO pf_root;


--
-- Name: FUNCTION create_statistics_file(); Type: ACL; Schema: pf_private; Owner: -
--

REVOKE ALL ON FUNCTION pf_private.create_statistics_file() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_private.create_statistics_file() TO pf_root;


--
-- Name: FUNCTION delete_partner_dataset_files(); Type: ACL; Schema: pf_private; Owner: -
--

REVOKE ALL ON FUNCTION pf_private.delete_partner_dataset_files() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_private.delete_partner_dataset_files() TO pf_root;


--
-- Name: FUNCTION enrich_partner_dataset(); Type: ACL; Schema: pf_private; Owner: -
--

REVOKE ALL ON FUNCTION pf_private.enrich_partner_dataset() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_private.enrich_partner_dataset() TO pf_root;


--
-- Name: FUNCTION process_partner_dataset_upload(); Type: ACL; Schema: pf_private; Owner: -
--

REVOKE ALL ON FUNCTION pf_private.process_partner_dataset_upload() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_private.process_partner_dataset_upload() TO pf_root;


--
-- Name: FUNCTION set_cell_from_model(); Type: ACL; Schema: pf_private; Owner: -
--

REVOKE ALL ON FUNCTION pf_private.set_cell_from_model() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_private.set_cell_from_model() TO pf_root;


--
-- Name: FUNCTION tg__add_job(); Type: ACL; Schema: pf_private; Owner: -
--

REVOKE ALL ON FUNCTION pf_private.tg__add_job() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_private.tg__add_job() TO pf_root;


--
-- Name: FUNCTION tg__timestamps(); Type: ACL; Schema: pf_private; Owner: -
--

REVOKE ALL ON FUNCTION pf_private.tg__timestamps() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_private.tg__timestamps() TO pf_root;


--
-- Name: TABLE pf_users; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_users TO pf_root;
GRANT SELECT,INSERT,UPDATE ON TABLE pf_private.pf_users TO pf_authenticated;


--
-- Name: FUNCTION upsert_user_and_log_last_active_at(sub text, email public.citext, name text); Type: ACL; Schema: pf_private; Owner: -
--

REVOKE ALL ON FUNCTION pf_private.upsert_user_and_log_last_active_at(sub text, email public.citext, name text) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_private.upsert_user_and_log_last_active_at(sub text, email public.citext, name text) TO pf_root;


--
-- Name: FUNCTION add_partner_example_dataset(name text, description text, original_file text, geodata_type text); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.add_partner_example_dataset(name text, description text, original_file text, geodata_type text) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.add_partner_example_dataset(name text, description text, original_file text, geodata_type text) TO pf_root;
GRANT ALL ON FUNCTION pf_public.add_partner_example_dataset(name text, description text, original_file text, geodata_type text) TO pf_admin;


--
-- Name: TABLE pf_partner_project_datasets; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_partner_project_datasets TO pf_root;
GRANT ALL ON TABLE pf_private.pf_partner_project_datasets TO pf_authenticated;


--
-- Name: FUNCTION associate_partner_project_and_dataset(project_id uuid, dataset_id uuid); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.associate_partner_project_and_dataset(project_id uuid, dataset_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.associate_partner_project_and_dataset(project_id uuid, dataset_id uuid) TO pf_root;
GRANT ALL ON FUNCTION pf_public.associate_partner_project_and_dataset(project_id uuid, dataset_id uuid) TO pf_authenticated;


--
-- Name: FUNCTION authenticate_pf_user(email public.citext, name text); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.authenticate_pf_user(email public.citext, name text) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.authenticate_pf_user(email public.citext, name text) TO pf_root;
GRANT ALL ON FUNCTION pf_public.authenticate_pf_user(email public.citext, name text) TO pf_anonymous;
GRANT ALL ON FUNCTION pf_public.authenticate_pf_user(email public.citext, name text) TO pf_authenticated;


--
-- Name: FUNCTION create_audit(action_type text, payload jsonb, user_ip text, message text, rate_limit_threshold integer); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.create_audit(action_type text, payload jsonb, user_ip text, message text, rate_limit_threshold integer) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.create_audit(action_type text, payload jsonb, user_ip text, message text, rate_limit_threshold integer) TO pf_root;
GRANT ALL ON FUNCTION pf_public.create_audit(action_type text, payload jsonb, user_ip text, message text, rate_limit_threshold integer) TO pf_partner;


--
-- Name: TABLE pf_partner_datasets; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_partner_datasets TO pf_root;
GRANT ALL ON TABLE pf_private.pf_partner_datasets TO pf_authenticated;


--
-- Name: FUNCTION create_partner_dataset(name text, description text); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.create_partner_dataset(name text, description text) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.create_partner_dataset(name text, description text) TO pf_root;
GRANT ALL ON FUNCTION pf_public.create_partner_dataset(name text, description text) TO pf_authenticated;


--
-- Name: TABLE pf_partner_dataset_enrichments; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_partner_dataset_enrichments TO pf_root;
GRANT ALL ON TABLE pf_private.pf_partner_dataset_enrichments TO pf_authenticated;


--
-- Name: FUNCTION create_partner_dataset_enrichment(pf_dataset_id integer, partner_dataset_id uuid, upload_id uuid, project_id uuid); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.create_partner_dataset_enrichment(pf_dataset_id integer, partner_dataset_id uuid, upload_id uuid, project_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.create_partner_dataset_enrichment(pf_dataset_id integer, partner_dataset_id uuid, upload_id uuid, project_id uuid) TO pf_root;
GRANT ALL ON FUNCTION pf_public.create_partner_dataset_enrichment(pf_dataset_id integer, partner_dataset_id uuid, upload_id uuid, project_id uuid) TO pf_authenticated;


--
-- Name: TABLE pf_partner_dataset_uploads; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_partner_dataset_uploads TO pf_root;
GRANT ALL ON TABLE pf_private.pf_partner_dataset_uploads TO pf_authenticated;


--
-- Name: FUNCTION create_partner_dataset_upload(file_url text, dataset_id uuid, geodata_type text, enrich boolean); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.create_partner_dataset_upload(file_url text, dataset_id uuid, geodata_type text, enrich boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.create_partner_dataset_upload(file_url text, dataset_id uuid, geodata_type text, enrich boolean) TO pf_root;
GRANT ALL ON FUNCTION pf_public.create_partner_dataset_upload(file_url text, dataset_id uuid, geodata_type text, enrich boolean) TO pf_authenticated;


--
-- Name: TABLE pf_partner_projects; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_partner_projects TO pf_root;
GRANT ALL ON TABLE pf_private.pf_partner_projects TO pf_authenticated;


--
-- Name: FUNCTION create_partner_project(name text, description text, pf_dataset_id integer); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.create_partner_project(name text, description text, pf_dataset_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.create_partner_project(name text, description text, pf_dataset_id integer) TO pf_root;
GRANT ALL ON FUNCTION pf_public.create_partner_project(name text, description text, pf_dataset_id integer) TO pf_authenticated;


--
-- Name: TABLE pf_partner_project_shares; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_partner_project_shares TO pf_root;
GRANT SELECT,INSERT ON TABLE pf_private.pf_partner_project_shares TO pf_authenticated;


--
-- Name: FUNCTION create_partner_project_share(project_id uuid); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.create_partner_project_share(project_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.create_partner_project_share(project_id uuid) TO pf_root;
GRANT ALL ON FUNCTION pf_public.create_partner_project_share(project_id uuid) TO pf_authenticated;


--
-- Name: TABLE pf_country_statistics; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_country_statistics TO pf_root;


--
-- Name: FUNCTION create_pf_country_statistics(country_id uuid, dataset_id integer); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.create_pf_country_statistics(country_id uuid, dataset_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.create_pf_country_statistics(country_id uuid, dataset_id integer) TO pf_root;
GRANT ALL ON FUNCTION pf_public.create_pf_country_statistics(country_id uuid, dataset_id integer) TO pf_authenticated;


--
-- Name: FUNCTION create_user_access_request(form_name text, email text, form_fields jsonb); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.create_user_access_request(form_name text, email text, form_fields jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.create_user_access_request(form_name text, email text, form_fields jsonb) TO pf_root;
GRANT ALL ON FUNCTION pf_public.create_user_access_request(form_name text, email text, form_fields jsonb) TO pf_anonymous;
GRANT ALL ON FUNCTION pf_public.create_user_access_request(form_name text, email text, form_fields jsonb) TO pf_admin;


--
-- Name: FUNCTION "current_user"(); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public."current_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public."current_user"() TO pf_root;
GRANT ALL ON FUNCTION pf_public."current_user"() TO pf_anonymous;
GRANT ALL ON FUNCTION pf_public."current_user"() TO pf_authenticated;


--
-- Name: FUNCTION current_user_id(); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.current_user_id() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.current_user_id() TO pf_root;
GRANT ALL ON FUNCTION pf_public.current_user_id() TO pf_anonymous;


--
-- Name: FUNCTION current_user_sub(); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.current_user_sub() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.current_user_sub() TO pf_root;
GRANT ALL ON FUNCTION pf_public.current_user_sub() TO pf_anonymous;
GRANT ALL ON FUNCTION pf_public.current_user_sub() TO pf_authenticated;
GRANT ALL ON FUNCTION pf_public.current_user_sub() TO pf_partner;


--
-- Name: FUNCTION delete_partner_dataset(dataset_id uuid); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.delete_partner_dataset(dataset_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.delete_partner_dataset(dataset_id uuid) TO pf_root;
GRANT ALL ON FUNCTION pf_public.delete_partner_dataset(dataset_id uuid) TO pf_authenticated;


--
-- Name: FUNCTION delete_partner_project(project_id uuid); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.delete_partner_project(project_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.delete_partner_project(project_id uuid) TO pf_root;
GRANT ALL ON FUNCTION pf_public.delete_partner_project(project_id uuid) TO pf_authenticated;


--
-- Name: FUNCTION delete_partner_project_dataset(project_id uuid, dataset_id uuid); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.delete_partner_project_dataset(project_id uuid, dataset_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.delete_partner_project_dataset(project_id uuid, dataset_id uuid) TO pf_root;
GRANT ALL ON FUNCTION pf_public.delete_partner_project_dataset(project_id uuid, dataset_id uuid) TO pf_authenticated;


--
-- Name: FUNCTION get_dataset_statistics(longitude double precision, latitude double precision, warming_scenario numeric[], dataset_id integer); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.get_dataset_statistics(longitude double precision, latitude double precision, warming_scenario numeric[], dataset_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.get_dataset_statistics(longitude double precision, latitude double precision, warming_scenario numeric[], dataset_id integer) TO pf_root;
GRANT ALL ON FUNCTION pf_public.get_dataset_statistics(longitude double precision, latitude double precision, warming_scenario numeric[], dataset_id integer) TO pf_anonymous;
GRANT ALL ON FUNCTION pf_public.get_dataset_statistics(longitude double precision, latitude double precision, warming_scenario numeric[], dataset_id integer) TO pf_partner;


--
-- Name: FUNCTION insert_map_with_a_new_mid_value_method(dataset_id integer, map_style_id character varying, method_used_for_mid text); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.insert_map_with_a_new_mid_value_method(dataset_id integer, map_style_id character varying, method_used_for_mid text) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.insert_map_with_a_new_mid_value_method(dataset_id integer, map_style_id character varying, method_used_for_mid text) TO pf_root;


--
-- Name: FUNCTION insert_new_version_of_an_existing_map(dataset_id integer, map_style_id character varying, map_version integer); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.insert_new_version_of_an_existing_map(dataset_id integer, map_style_id character varying, map_version integer) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.insert_new_version_of_an_existing_map(dataset_id integer, map_style_id character varying, map_version integer) TO pf_root;
GRANT ALL ON FUNCTION pf_public.insert_new_version_of_an_existing_map(dataset_id integer, map_style_id character varying, map_version integer) TO pf_anonymous;


--
-- Name: FUNCTION pf_audit_table_delete_old_rows(); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.pf_audit_table_delete_old_rows() FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.pf_audit_table_delete_old_rows() TO pf_root;
GRANT ALL ON FUNCTION pf_public.pf_audit_table_delete_old_rows() TO pf_anonymous;
GRANT ALL ON FUNCTION pf_public.pf_audit_table_delete_old_rows() TO pf_partner;


--
-- Name: FUNCTION pf_update_user_access_request(id uuid, access_granted boolean, note text, rejected boolean); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, rejected boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, rejected boolean) TO pf_root;
GRANT ALL ON FUNCTION pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, rejected boolean) TO pf_anonymous;
GRANT ALL ON FUNCTION pf_public.pf_update_user_access_request(id uuid, access_granted boolean, note text, rejected boolean) TO pf_admin;


--
-- Name: FUNCTION project_share(slug_id uuid); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.project_share(slug_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.project_share(slug_id uuid) TO pf_root;
GRANT ALL ON FUNCTION pf_public.project_share(slug_id uuid) TO pf_anonymous;
GRANT ALL ON FUNCTION pf_public.project_share(slug_id uuid) TO pf_authenticated;


--
-- Name: FUNCTION update_partner_dataset(dataset_name text, dataset_id uuid); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.update_partner_dataset(dataset_name text, dataset_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.update_partner_dataset(dataset_name text, dataset_id uuid) TO pf_root;
GRANT ALL ON FUNCTION pf_public.update_partner_dataset(dataset_name text, dataset_id uuid) TO pf_authenticated;


--
-- Name: FUNCTION update_partner_project(project_id uuid, map_config jsonb, image_url text, pf_dataset_id integer, project_name text); Type: ACL; Schema: pf_public; Owner: -
--

REVOKE ALL ON FUNCTION pf_public.update_partner_project(project_id uuid, map_config jsonb, image_url text, pf_dataset_id integer, project_name text) FROM PUBLIC;
GRANT ALL ON FUNCTION pf_public.update_partner_project(project_id uuid, map_config jsonb, image_url text, pf_dataset_id integer, project_name text) TO pf_root;
GRANT ALL ON FUNCTION pf_public.update_partner_project(project_id uuid, map_config jsonb, image_url text, pf_dataset_id integer, project_name text) TO pf_authenticated;


--
-- Name: TABLE pf_dataset_statistics; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_dataset_statistics TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_dataset_statistics TO pf_authenticated;


--
-- Name: TABLE aggregate_pf_dataset_statistics; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.aggregate_pf_dataset_statistics TO pf_root;


--
-- Name: TABLE pf_grid_coordinates; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_grid_coordinates TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_grid_coordinates TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.pf_grid_coordinates TO pf_authenticated;


--
-- Name: TABLE aggregate_pf_dataset_statistic_cells; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.aggregate_pf_dataset_statistic_cells TO pf_root;


--
-- Name: TABLE connect_pg_simple_sessions; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.connect_pg_simple_sessions TO pf_root;


--
-- Name: TABLE pf_audit; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_audit TO pf_root;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE pf_private.pf_audit TO pf_partner;


--
-- Name: TABLE pf_partner_dataset_coordinates; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_partner_dataset_coordinates TO pf_root;


--
-- Name: TABLE pf_partner_enrichment_statuses; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_partner_enrichment_statuses TO pf_root;


--
-- Name: TABLE pf_user_access_requests; Type: ACL; Schema: pf_private; Owner: -
--

GRANT ALL ON TABLE pf_private.pf_user_access_requests TO pf_root;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE pf_private.pf_user_access_requests TO pf_admin;


--
-- Name: TABLE countries; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.countries TO pf_root;
GRANT SELECT ON TABLE pf_public.countries TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.countries TO pf_authenticated;


--
-- Name: TABLE pf_dataset_model_grids; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_dataset_model_grids TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_dataset_model_grids TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.pf_dataset_model_grids TO pf_authenticated;


--
-- Name: TABLE pf_dataset_model_sources; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_dataset_model_sources TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_dataset_model_sources TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.pf_dataset_model_sources TO pf_authenticated;


--
-- Name: TABLE pf_dataset_parent_categories; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_dataset_parent_categories TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_dataset_parent_categories TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.pf_dataset_parent_categories TO pf_authenticated;


--
-- Name: TABLE pf_dataset_sub_categories; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_dataset_sub_categories TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_dataset_sub_categories TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.pf_dataset_sub_categories TO pf_authenticated;


--
-- Name: TABLE pf_dataset_units; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_dataset_units TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_dataset_units TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.pf_dataset_units TO pf_authenticated;


--
-- Name: TABLE pf_datasets; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_datasets TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_datasets TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.pf_datasets TO pf_authenticated;


--
-- Name: TABLE pf_map_statuses; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_map_statuses TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_map_statuses TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.pf_map_statuses TO pf_authenticated;


--
-- Name: TABLE pf_maps; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_maps TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_maps TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.pf_maps TO pf_authenticated;


--
-- Name: TABLE pf_statistical_variable_names; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_statistical_variable_names TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_statistical_variable_names TO pf_authenticated;


--
-- Name: TABLE pf_warming_scenarios; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.pf_warming_scenarios TO pf_root;
GRANT SELECT ON TABLE pf_public.pf_warming_scenarios TO pf_anonymous;
GRANT SELECT ON TABLE pf_public.pf_warming_scenarios TO pf_authenticated;


--
-- Name: TABLE view_partner_dataset_enrichments; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.view_partner_dataset_enrichments TO pf_root;
GRANT SELECT ON TABLE pf_public.view_partner_dataset_enrichments TO pf_authenticated;


--
-- Name: TABLE view_partner_dataset_uploads; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.view_partner_dataset_uploads TO pf_root;
GRANT SELECT ON TABLE pf_public.view_partner_dataset_uploads TO pf_authenticated;


--
-- Name: TABLE view_partner_datasets; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.view_partner_datasets TO pf_root;
GRANT SELECT ON TABLE pf_public.view_partner_datasets TO pf_authenticated;


--
-- Name: TABLE view_partner_project_datasets; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.view_partner_project_datasets TO pf_root;
GRANT SELECT ON TABLE pf_public.view_partner_project_datasets TO pf_authenticated;


--
-- Name: TABLE view_partner_projects; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.view_partner_projects TO pf_root;
GRANT SELECT ON TABLE pf_public.view_partner_projects TO pf_authenticated;


--
-- Name: TABLE view_pf_country_statistics; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.view_pf_country_statistics TO pf_root;
GRANT SELECT ON TABLE pf_public.view_pf_country_statistics TO pf_authenticated;


--
-- Name: TABLE view_user_access_request; Type: ACL; Schema: pf_public; Owner: -
--

GRANT ALL ON TABLE pf_public.view_user_access_request TO pf_root;
GRANT SELECT ON TABLE pf_public.view_user_access_request TO pf_admin;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: pf_hidden; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_hidden GRANT ALL ON SEQUENCES TO pf_root;
ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_hidden GRANT SELECT,USAGE ON SEQUENCES TO pf_anonymous;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: pf_hidden; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_hidden GRANT ALL ON TYPES TO pf_root;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: pf_hidden; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_hidden GRANT ALL ON FUNCTIONS TO pf_root;
ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_hidden GRANT ALL ON FUNCTIONS TO pf_anonymous;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: pf_hidden; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_hidden GRANT ALL ON TABLES TO pf_root;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: pf_private; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_private GRANT ALL ON SEQUENCES TO pf_root;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: pf_private; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_private GRANT ALL ON TYPES TO pf_root;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: pf_private; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_private GRANT ALL ON FUNCTIONS TO pf_root;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: pf_private; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_private GRANT ALL ON TABLES TO pf_root;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: pf_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_public GRANT ALL ON SEQUENCES TO pf_root;
ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_public GRANT SELECT,USAGE ON SEQUENCES TO pf_anonymous;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: pf_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_public GRANT ALL ON TYPES TO pf_root;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: pf_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_public GRANT ALL ON FUNCTIONS TO pf_root;
ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_public GRANT ALL ON FUNCTIONS TO pf_anonymous;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: pf_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA pf_public GRANT ALL ON TABLES TO pf_root;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA public GRANT ALL ON SEQUENCES TO pf_root;
ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO pf_anonymous;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA public GRANT ALL ON TYPES TO pf_root;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA public GRANT ALL ON FUNCTIONS TO pf_root;
ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA public GRANT ALL ON FUNCTIONS TO pf_anonymous;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner IN SCHEMA public GRANT ALL ON TABLES TO pf_root;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pf_owner REVOKE ALL ON FUNCTIONS FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

