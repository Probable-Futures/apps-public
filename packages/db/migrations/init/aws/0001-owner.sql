create role :DATABASE_OWNER with login password :'DATABASE_OWNER_PASSWORD'
                            role :DATABASE_ROOT_USER;

comment on role :DATABASE_OWNER is
  E'Role that `owns` the database and is used for migrations.';

grant :DATABASE_SUPERUSER TO :DATABASE_OWNER;
