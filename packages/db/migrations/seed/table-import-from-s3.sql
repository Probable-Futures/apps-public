
select * from aws_s3.table_import_from_s3(
  :'IMPORT_TABLE_NAME',
  :'IMPORT_TABLE_COLUMNS',
  '(format csv, header)',
  aws_commons.create_s3_uri(
    :'IMPORT_BUCKET_NAME',
    :'IMPORT_BUCKET_FILE_PATH',
    :'IMPORT_BUCKET_REGION'
  )
);
