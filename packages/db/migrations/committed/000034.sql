--! Previous: sha1:41440ff93fcf9d710864ea0498bf9a4035363e64
--! Hash: sha1:97ceac5a02f05bf4b7bc65c274aafa6af043c34a

--! split: 1-current.sql
drop trigger if exists _500_upload on pf_private.pf_partner_dataset_uploads cascade;

create trigger _500_upload
  after insert on pf_private.pf_partner_dataset_uploads for each row
  execute procedure pf_private.process_partner_dataset_upload ();
