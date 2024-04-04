--! Previous: sha1:cec7cbfc27741dc4f55e9ee5dc21883aa2340b16
--! Hash: sha1:f43974b26e58baf591eb6350b2b6aed69f60e827

--! split: 1-current.sql
-- Enter migration here

drop view if exists pf_public.view_partner_project_datasets;
create or replace view pf_public.view_partner_project_datasets
  as select 
    pp.id as project_id,
    pp.name as project_name,
    pp.description as project_description,
    pd.id as dataset_id,
    pd.name as dataset_name,
    pd.description as dataset_description,
    pd.upload_id as upload_id,
    pdu.original_file as original_file,
    pde.enriched_dataset_file as enriched_dataset_file,
    pde.pf_dataset_id as pf_dataset_id
  from pf_private.pf_partner_project_datasets ppd
    join pf_private.pf_partner_projects pp
      on pp.id = ppd.project_id
    join pf_private.pf_partner_datasets pd
      on pd.id = ppd.dataset_id
    join pf_private.pf_partner_dataset_uploads pdu
      on pd.upload_id = pdu.id
    left join pf_private.pf_partner_dataset_enrichments pde
      on pp.id = pde.project_id and pdu.id = pde.upload_id and pd.id = pde.partner_dataset_id
  where pp.partner_id = (pf_public.current_user()).id;

comment on view pf_public.view_partner_project_datasets
  is E'@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)\n@foreignKey (project_id) references pf_private.pf_partner_projects (id)';
comment on column pf_public.view_partner_project_datasets.dataset_name
  is E'@notNull';
comment on column pf_public.view_partner_project_datasets.project_name
  is E'@notNull';

grant select on pf_public.view_partner_project_datasets to :AUTHENTICATED_ROLE;
