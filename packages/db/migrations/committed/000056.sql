--! Previous: sha1:9c51f0e8af37eb77c69d27c29cef8074e38605d3
--! Hash: sha1:511de778c9f6b6c0aa8fcd609e6719b75fcc0e00

--! split: 1-current.sql
-- add enrichment_created_at and enrichment_updated_at to the response
-- lastely order by pde.created_at
create or replace view pf_public.view_partner_project_datasets as
select
  pp.id as project_id,
  pp.name as project_name,
  pp.description as project_description,
  pd.id as dataset_id,
  pd.name as dataset_name,
  pd.description as dataset_description,
  pdu.id as upload_id,
  pdu.original_file as original_file,
  pde.enriched_dataset_file as enriched_dataset_file,
  pdu.processed_with_coordinates_file as processed_with_coordinates_file,
  pdu.enrich as enrich,
  pdu.processed_with_coordinates_row_count as processed_with_coordinates_row_count,
  pdu.status as processing_status,
  pde.status as enrichment_status,
  pde.pf_dataset_id,
  pde.id as enriched_dataset_id,
  pd.is_example as is_example,
  pde.created_at as enrichment_created_at,
  pde.created_at as enrichment_updated_at
from
  pf_private.pf_partner_project_datasets ppd
  join pf_private.pf_partner_projects pp on pp.id = ppd.project_id
  join pf_private.pf_partner_datasets pd on pd.id = ppd.dataset_id
  join pf_private.pf_partner_dataset_uploads pdu on pd.id = pdu.partner_dataset_id
  left join pf_private.pf_partner_dataset_enrichments pde on pdu.id = pde.upload_id
    and pd.id = pde.partner_dataset_id
where
  pp.partner_id = (pf_public.current_user()).id
order by
  ppd.created_at, pde.created_at;

-- add enrichment_created_at and enrichment_updated_at to the response
-- lastely order by pde.created_at
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
      pde.pf_dataset_id,
      pd.name as dataset_name,
      pde.created_at as enrichment_created_at,
      pde.created_at as enrichment_updated_at
    from
      pf_private.pf_partner_project_datasets ppd
      join pf_private.pf_partner_datasets pd on ppd.dataset_id = pd.id
      join pf_private.pf_partner_dataset_uploads pdu on pdu.partner_dataset_id = ppd.dataset_id
      left join pf_private.pf_partner_dataset_enrichments pde on pdu.id = pde.upload_id
        and ppd.dataset_id = pde.partner_dataset_id
    where
      ppd.project_id = _partner_project_share.project_id
    order by
      ppd.created_at, pde.created_at
)
  select
    jsonb_agg(jsonb_build_object('upload_id', upload_id, 'partner_dataset_id', partner_dataset_id, 'original_file', 
      original_file, 'enriched_dataset_file', enriched_dataset_file, 'processed_with_coordinates_file',
      processed_with_coordinates_file, 'enrich', enrich, 'pf_dataset_id', pf_dataset_id, 'name', dataset_name,
      'enrichment_created_at', enrichment_created_at, 'enrichment_updated_at', enrichment_updated_at))
  into _response.project_datasets
  from
    rows;
  return _response;
end;
$$;
