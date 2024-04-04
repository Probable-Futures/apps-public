
create or replace function pf_hidden.import_dataset_statistics_from_s3(environment text, dataset_id integer)
  returns text
  language sql as $fn$
  select * from aws_s3.table_import_from_s3(
    'pf_public.pf_dataset_statistics',
    'dataset_id, coordinate_hash, warming_scenario, low_value, mid_value, high_value',
    '(format csv, header)',
    aws_commons.create_s3_uri(
      'global-pf-data-engineering',
      format('%s/postgres/copies/pf_public.pf_dataset_statistics/%s.csv', environment, dataset_id),
      'us-west-2'
    )
  );
$fn$;

comment on function pf_hidden.import_dataset_statistics_from_s3(environment text, dataset_id integer) is
  E'Helper function to import dataset statistics from csv files in s3';

analyze pf_public.pf_dataset_statistics;
