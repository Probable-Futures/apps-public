--! Previous: sha1:afdf56c5aee688f3a297295048aafdb595028703
--! Hash: sha1:360445623178f83db7c5254c9e249323ebbf23cc

--! split: 1-current.sql
-- Enter migration here
drop view if exists pf_public.view_partner_projects;
create or replace view pf_public.view_partner_projects as
  select pp.id,
    pp.name,
    pp.description,
    pp.map_config,
    pp.created_at,
    pp.updated_at,
    pde.pf_dataset_id
from pf_private.pf_partner_projects pp
  join pf_private.pf_partner_dataset_enrichments pde 
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
