--! Previous: sha1:b140db31c8d68bb2f4f55dbb5d6bf8506f6c1414
--! Hash: sha1:653ec0df1f51e202bfe4aa899fd98cff9a1025e8

--! split: 1-current.sql
create or replace function pf_public.delete_partner_dataset (dataset_id uuid)
  returns boolean
  language plpgsql
  strict
  security definer
  as $$
begin
  if not exists (
    select
      1
    from
      pf_private.pf_partner_datasets
    where
      id = dataset_id) then
  raise exception 'dataset % not found', dataset_id;
end if;
  delete from pf_private.pf_partner_datasets
  where id = dataset_id
    and partner_id = (pf_public.current_user()).id;
  return true;
end;
$$;

create or replace function pf_public.delete_partner_project (project_id uuid)
  returns boolean
  language plpgsql
  strict
  security definer
  as $$
begin
  if not exists (
    select
      1
    from
      pf_private.pf_partner_projects
    where
      id = project_id) then
  raise exception 'project % not found', project_id;
end if;
  delete from pf_private.pf_partner_datasets
  where id in (
      select
        d.id
      from
        pf_private.pf_partner_datasets d
        inner join pf_private.pf_partner_project_datasets pd on d.id = pd.dataset_id
        inner join pf_private.pf_partner_projects p on p.id = pd.project_id
      where
        p.id = delete_partner_project.project_id
        and d.partner_id = (pf_public.current_user()).id);
  delete from pf_private.pf_partner_projects
  where id = project_id;
  return true;
end;
$$;

grant all on function pf_public.delete_partner_project (project_id uuid) to :AUTHENTICATED_ROLE;

grant all on function pf_public.delete_partner_dataset (dataset_id uuid) to :AUTHENTICATED_ROLE;
