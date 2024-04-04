create extension if not exists plpgsql with schema pg_catalog;

create extension if not exists "uuid-ossp" with schema public;

create extension if not exists citext with schema public;

create extension if not exists pgcrypto with schema public;

create extension if not exists pg_stat_statements with schema public;

create extension if not exists postgis;

--needed for postgis_tiger_geocoder
create extension if not exists fuzzystrmatch;

-- useful for spatial indexes
create extension if not exists btree_gist;
