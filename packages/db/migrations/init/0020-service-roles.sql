create role :GRAPHILE_ROLE with login password :'GRAPHILE_ROLE_PASSWORD' noinherit;

comment on role :GRAPHILE_ROLE is E'Role with minimal permissions used for connections from the postgraphile server.';

grant connect on database :DATABASE_NAME to :GRAPHILE_ROLE;

-- Role for un-authenticated queries
create role :VISITOR_ROLE;

comment on role :VISITOR_ROLE is E'Role used for executing database queries from unauthenticated server requests.';

-- Role for queries from an authenticated user
create role :AUTHENTICATED_ROLE;

comment on role :AUTHENTICATED_ROLE is E'Role used for executing database queries from authenticated server requests.';

grant :VISITOR_ROLE to :GRAPHILE_ROLE;

grant :AUTHENTICATED_ROLE to :GRAPHILE_ROLE;

create role :ADMIN_ROLE;

comment on role :ADMIN_ROLE is E'Role used for executing database queries from an admin authenticated server requests.';

grant :AUTHENTICATED_ROLE to :ADMIN_ROLE;

grant :ADMIN_ROLE to :GRAPHILE_ROLE;

create role :PARTNER_ROLE;

comment on role :PARTNER_ROLE is E'Role used for executing database queries from a PF partner authenticated server requests.';

grant :PARTNER_ROLE to :GRAPHILE_ROLE;

grant :VISITOR_ROLE to :PARTNER_ROLE;

grant :PARTNER_ROLE to :AUTHENTICATED_ROLE;
