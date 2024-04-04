drop role if exists :DATABASE_OWNER;
create role :DATABASE_OWNER with login password :'DATABASE_OWNER_PASSWORD' SUPERUSER;
comment on role :DATABASE_OWNER is
  E'Role that `owns` the database and is used for migrations and the worker.';
