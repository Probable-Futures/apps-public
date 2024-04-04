-- Create database
create database :DATABASE_NAME OWNER :DATABASE_OWNER ENCODING UTF8;

comment on database :DATABASE_NAME is
  E'Primary database for the Probable Futures core platform';

-- Database permissions
revoke all on database :DATABASE_NAME from public;
grant all on database :DATABASE_NAME to :DATABASE_OWNER;
grant all on database :DATABASE_NAME to :DATABASE_ROOT_USER;
