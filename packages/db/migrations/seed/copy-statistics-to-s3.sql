create or replace function pf_hidden.export_dataset_statistics(environment text, dataset_id integer)
  returns text
  language sql as $fn$
  select * from aws_s3.query_export_to_s3( 
    query => format(
      'select dataset_id, coordinate_hash, warming_scenario, low_value, mid_value, high_value 
        from pf_public.pf_dataset_statistics 
          where dataset_id = %L', dataset_id
      ), 
    bucket => 'global-pf-data-engineering', 
    file_path => format(
      '%s/postgres/copies/pf_public.pf_dataset_statistics/%s.csv', environment, dataset_id
    ), 
    region => 'us-west-2', 
    options => 'format csv, header');

$fn$;

comment on function pf_hidden.export_dataset_statistics(environment text, dataset_id integer) is E'Helper function to export dataset statistics from db to s3';

