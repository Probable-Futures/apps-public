--! Previous: sha1:511de778c9f6b6c0aa8fcd609e6719b75fcc0e00
--! Hash: sha1:dae7ccee0a39fd81827e6005acbdf8235b6fbed2

--! split: 1-current.sql
drop trigger if exists _500_delete_partner_dataset_files on pf_private.pf_partner_datasets cascade;

create or replace function pf_private.delete_partner_dataset_files() returns trigger
    language plpgsql security DEFINER
    as $$
    declare 
      files text[];
begin
  select array_agg(distinct file_name) 
    into files
    from (
      select original_file as file_name from pf_private.pf_partner_dataset_uploads where partner_dataset_id = old.id and original_file is not null
      union
      select processed_file as file_name from pf_private.pf_partner_dataset_uploads where partner_dataset_id = old.id and processed_file is not null
      union
      select processed_with_coordinates_file as file_name from pf_private.pf_partner_dataset_uploads where partner_dataset_id = old.id and processed_with_coordinates_file is not null
      union 
      select enriched_dataset_file from pf_private.pf_partner_dataset_enrichments where partner_dataset_id = old.id and enriched_dataset_file is not null
    ) as files;
    if (select cardinality(files::text[])) >= 1
    then
      perform
        graphile_worker.add_job ('delete_partner_dataset_files', payload := json_build_object('id', (old.id), 'partnerId', (old.partner_id), 'files', files), max_attempts := 1);
    end if;
  return old;
end;
$$;


create trigger _500_delete_partner_dataset_files before delete on pf_private.pf_partner_datasets for each row execute function pf_private.delete_partner_dataset_files();
