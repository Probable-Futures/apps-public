--! Previous: sha1:befa2ae5088643dcaa5c28bd3898e00469084241
--! Hash: sha1:1658af3f672037484e628132d990e3f5780fa20b

--! split: 1-current.sql
create or replace function pf_public.create_partner_project_share(
  project_id uuid
) returns pf_private.pf_partner_project_shares
  language sql volatile security invoker
  AS $$
  insert into pf_private.pf_partner_project_shares
    (project_id)
  values
    (project_id)
  returning *;
$$;

drop type if exists pf_public.project_share_response cascade;
create type pf_public.project_share_response as (pf_dataset_ids integer[], enriched_dataset_files text[], map_config jsonb);

create or replace function pf_public.project_share(
  slug_id uuid
  )
  returns project_share_response
  language plpgsql strict security definer
  as $$
  declare
    _partner_project_share pf_private.pf_partner_project_shares;
    _response project_share_response;
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
        on pde.project_id = ppd.project_id
      where ppd.project_id = _partner_project_share.project_id
    )
    select array_agg(pf_dataset_id), array_agg(enriched_dataset_file) into _response.pf_dataset_ids, _response.enriched_dataset_files from rows;
    
    return _response;
  end;
  $$;

grant all on function pf_public.project_share(slug_id uuid) to :VISITOR_ROLE;
grant all on function pf_public.project_share(slug_id uuid) to :AUTHENTICATED_ROLE;
grant all on function pf_public.create_partner_project_share(project_id uuid) to :AUTHENTICATED_ROLE;
