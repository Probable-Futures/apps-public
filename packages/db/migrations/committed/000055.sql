--! Previous: sha1:91f782b0537e2c32df87df7b4efe5198ab9a197b
--! Hash: sha1:9c51f0e8af37eb77c69d27c29cef8074e38605d3

--! split: 1-current.sql
drop function if exists pf_public.update_partner_project (project_id uuid, map_config jsonb, image_url text, pf_dataset_id integer);

create or replace function pf_public.update_partner_project (project_id uuid, map_config jsonb = null, image_url text = null, pf_dataset_id integer = null, project_name text = null)
  returns pf_private.pf_partner_projects
  language sql
  as $$
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

grant all on function pf_public.update_partner_project (project_id uuid, map_config jsonb, image_url text, pf_dataset_id integer, project_name text) to :AUTHENTICATED_ROLE;
