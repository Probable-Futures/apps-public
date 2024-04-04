--! Previous: sha1:14d25c2c542cfa9b320eceb967c194cfe40a0bcf
--! Hash: sha1:27d201aeeab4769af35db5d75fe195fe7b600caf

--! split: 1-current.sql
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
      pd.name as dataset_name
    from
      pf_private.pf_partner_project_datasets ppd
      join pf_private.pf_partner_datasets pd on ppd.dataset_id = pd.id
      join pf_private.pf_partner_dataset_uploads pdu on pdu.partner_dataset_id = ppd.dataset_id
      left join pf_private.pf_partner_dataset_enrichments pde on pdu.id = pde.upload_id
        and ppd.dataset_id = pde.partner_dataset_id
    where
      ppd.project_id = _partner_project_share.project_id
    order by
      ppd.created_at
)
  select
    jsonb_agg(jsonb_build_object('upload_id', upload_id, 'partner_dataset_id', partner_dataset_id, 'original_file', original_file, 'enriched_dataset_file', enriched_dataset_file, 'processed_with_coordinates_file', processed_with_coordinates_file, 'enrich', enrich, 'pf_dataset_id', pf_dataset_id, 'name', dataset_name)) into _response.project_datasets
  from
    rows;
  return _response;
end;
$$;
