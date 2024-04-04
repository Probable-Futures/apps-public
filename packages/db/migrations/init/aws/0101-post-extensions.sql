
--optional used by postgis_tiger_geocoder, or can be used standalone
create extension if not exists address_standardizer;
create extension if not exists address_standardizer_data_us;
create extension if not exists postgis_tiger_geocoder;
create extension if not exists postgis_topology;

-- RDS Aurora Specific Settings
alter schema tiger owner to rds_superuser;
alter schema tiger_data owner to rds_superuser;
alter schema topology owner to rds_superuser;

create function exec(text) returns text language plpgsql volatile as $f$ begin execute $1; return $1; end; $f$;

select exec('alter table ' || quote_ident(s.nspname) || '.' || quote_ident(s.relname) || ' owner to rds_superuser;')
  from (
    select nspname, relname
    from pg_class c join pg_namespace n on (c.relnamespace = n.oid)
    where nspname in ('tiger','topology') and
    relkind in ('r','S','v') order by relkind = 'S')
s;

-- Aurora Specific Extensions
-- create extension if not exists apg_plan_mgmt;
create extension if not exists aurora_stat_utils;
create extension if not exists aws_commons;
create extension if not exists aws_lambda;
create extension if not exists aws_s3;
