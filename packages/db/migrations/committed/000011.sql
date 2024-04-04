--! Previous: sha1:0e2ead4535a5d41e8d73bf89dfba27fa961e2ec2
--! Hash: sha1:e25c3866088c6807575e8a1f6680eb8b5a92ac32

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
      on pdu.id = pde.upload_id
  where pp.partner_id = (pf_public.current_user()).id;

comment on view pf_public.view_partner_project_datasets
  is E'@foreignKey (upload_id) references pf_private.pf_partner_dataset_uploads (id)\n@foreignKey (project_id) references pf_private.pf_partner_projects (id)';
comment on column pf_public.view_partner_project_datasets.dataset_name
  is E'@notNull';
comment on column pf_public.view_partner_project_datasets.project_name
  is E'@notNull';

grant select on pf_public.view_partner_project_datasets to :AUTHENTICATED_ROLE;
