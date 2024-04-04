--! Previous: sha1:7fde37a2b3449cb057b3e99e2fb8dfbcf9f1d79a
--! Hash: sha1:8c68cf07521b105ff51a23b4385567d75a11b23d

--! split: 1-current.sql
-- Enter migration here
alter table pf_private.pf_partner_projects
  add column if not exists image_url text;


create or replace function pf_public.update_project_image(
  project_id uuid,
  image_url text
) returns pf_private.pf_partner_projects
  language sql volatile security invoker
  AS $$
  update pf_private.pf_partner_projects
    set image_url = update_project_image.image_url
  where id = project_id
  returning *;
$$;

grant all on function pf_public.update_project_image(project_id uuid, image_url text) to :AUTHENTICATED_ROLE;

drop view if exists pf_public.view_partner_projects;
create or replace view pf_public.view_partner_projects as
  select pp.id as id,
    pp.name as name,
    pp.description as description,
    pp.map_config as map_config,
    pp.created_at as created_at,
    pp.updated_at as updated_at,
    pp.image_url as image_url,
    pde.pf_dataset_id as pf_dataset_id
from pf_private.pf_partner_projects pp
  left join pf_private.pf_partner_dataset_enrichments pde 
  on pde.id = 
    (select pde1.id from pf_private.pf_partner_dataset_enrichments pde1 where pde1.project_id = pp.id limit 1)
where pp.partner_id = (pf_public.current_user()).id;

comment on view pf_public.view_partner_projects
  is E'@primaryKey id';
comment on column pf_public.view_partner_projects.name
  is E'@notNull';
comment on column pf_public.view_partner_projects.created_at
  is E'@notNull';

grant select on pf_public.view_partner_projects to :AUTHENTICATED_ROLE;
