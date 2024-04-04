--! Previous: sha1:ccba2729077376d2490c855f13f280e662e98520
--! Hash: sha1:afdf56c5aee688f3a297295048aafdb595028703

--! split: 1-current.sql
-- Enter migration here
create or replace function pf_public.project_share(
  slug_id uuid
  )
  returns pf_public.project_share_response
  language plpgsql strict security definer
  as $$
  declare
    _partner_project_share pf_private.pf_partner_project_shares;
    _response pf_public.project_share_response;
  begin
    select * into _partner_project_share from pf_private.pf_partner_project_shares where id = slug_id;
    if _partner_project_share is null
        then raise exception 'SlugId % not found', slug_id;
    end if;
    if now() > _partner_project_share.expires_at
      then raise exception 'Link is expired';
    end if;
    select map_config into _response.map_config from pf_private.pf_partner_projects where id = _partner_project_share.project_id;
    with rows as (
      select
        pde.pf_dataset_id as pf_dataset_id,
        pde.enriched_dataset_file as enriched_dataset_file
      from pf_private.pf_partner_project_datasets ppd
      left join pf_private.pf_partner_dataset_enrichments pde
        on ppd.project_id = pde.project_id and ppd.dataset_id = pde.partner_dataset_id
      where ppd.project_id = _partner_project_share.project_id
    )
    select array_agg(pf_dataset_id), array_agg(enriched_dataset_file) into _response.pf_dataset_ids, _response.enriched_dataset_files from rows;
    
    return _response;
  end;
  $$;

grant all on function pf_public.project_share(slug_id uuid) to :VISITOR_ROLE;
grant all on function pf_public.project_share(slug_id uuid) to :AUTHENTICATED_ROLE;
