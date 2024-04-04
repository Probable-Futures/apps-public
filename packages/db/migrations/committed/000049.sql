--! Previous: sha1:ad1013a1798f69654623168e995d9a6e602aa416
--! Hash: sha1:7fed9102983691cc0ef701c3a4bdbc82072b115c

--! split: 1-dataset-statistics-permissions.sql
grant all on function pf_public.get_dataset_statistics to :VISITOR_ROLE;

--! split: 2-recreate-project-share.sql
create or replace function pf_public.project_share (slug_id uuid)
  returns pf_public.project_share_response
  language plpgsql
  strict
  security definer
  as $$
declare
  _partner_project_share pf_private.pf_partner_project_shares;
  _response pf_public.project_share_response;
begin
  select
    * into _partner_project_share
  from
    pf_private.pf_partner_project_shares
  where
    id = slug_id;
  if _partner_project_share is null then
    raise exception 'SlugId % not found', slug_id;
  end if;
  if now() > _partner_project_share.expires_at then
    raise exception 'Link is expired';
  end if;
  select
    map_config,
    pf_dataset_id into _response.map_config,
    _response.pf_dataset_id
  from
    pf_private.pf_partner_projects
  where
    id = _partner_project_share.project_id;
  with rows as (
    select
      pdu.id as upload_id,
      pdu.partner_dataset_id,
      pdu.original_file,
      pde.enriched_dataset_file,
      pdu.processed_with_coordinates_file,
      pdu.enrich,
      pde.pf_dataset_id
    from
      pf_private.pf_partner_project_datasets ppd
      join pf_private.pf_partner_dataset_uploads pdu on pdu.partner_dataset_id = ppd.dataset_id
      left join pf_private.pf_partner_dataset_enrichments pde on pdu.id = pde.upload_id
        and ppd.dataset_id = pde.partner_dataset_id
    where
      ppd.project_id = _partner_project_share.project_id
    order by
      ppd.created_at
)
  select
    jsonb_agg(jsonb_build_object('upload_id', upload_id, 'partner_dataset_id', partner_dataset_id, 'original_file', original_file, 'enriched_dataset_file', enriched_dataset_file, 'processed_with_coordinates_file', processed_with_coordinates_file, 'enrich', enrich, 'pf_dataset_id', pf_dataset_id)) into _response.project_datasets
  from
    rows;
  return _response;
end;
$$;
