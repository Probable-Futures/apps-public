--! Previous: sha1:e5ea60f559bac0115dcdefcdb0c66d7ea8a07e3a
--! Hash: sha1:5a310f357998f5fd5d95d74a7a115700476d48b4

--! split: 1-current.sql
revoke execute on function get_dataset_statistics FROM :VISITOR_ROLE;
revoke execute on function add_partner_example_dataset from :VISITOR_ROLE;
revoke execute on function associate_partner_project_and_dataset from :VISITOR_ROLE;
revoke execute on function create_audit from :VISITOR_ROLE;
revoke execute on function create_partner_dataset from :VISITOR_ROLE;
revoke execute on function create_partner_dataset_enrichment from :VISITOR_ROLE;
revoke execute on function create_partner_dataset_upload from :VISITOR_ROLE;
revoke execute on function create_partner_project from :VISITOR_ROLE;
revoke execute on function create_partner_project_share from :VISITOR_ROLE;
revoke execute on function create_pf_country_statistics from :VISITOR_ROLE;
revoke execute on function delete_partner_dataset from :VISITOR_ROLE;
revoke execute on function delete_partner_project from :VISITOR_ROLE;
revoke execute on function delete_partner_project_dataset from :VISITOR_ROLE;
revoke execute on function insert_map_with_a_new_mid_value_method from :VISITOR_ROLE;
revoke execute on function insert_new_version_of_an_existing_map from :VISITOR_ROLE;
revoke execute on function update_partner_dataset from :VISITOR_ROLE;
revoke execute on function update_partner_project from :VISITOR_ROLE;
