--! Previous: sha1:cd7140cc9d353619bf73cb946b46ef4d081727c7
--! Hash: sha1:14d25c2c542cfa9b320eceb967c194cfe40a0bcf

--! split: 1-current.sql
create or replace function pf_public.delete_partner_project_dataset (project_id uuid, dataset_id uuid)
  returns boolean
  language plpgsql
  strict
  security definer
  as $$
begin
  delete from pf_private.pf_partner_project_datasets ppd
  where ppd.dataset_id = delete_partner_project_dataset.dataset_id
    and ppd.project_id = delete_partner_project_dataset.project_id;
  return true;
end;
$$;

grant all on function pf_public.delete_partner_project_dataset (project_id uuid, dataset_id uuid) to :AUTHENTICATED_ROLE;
