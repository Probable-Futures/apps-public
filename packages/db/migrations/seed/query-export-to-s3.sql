select * from aws_s3.query_export_to_s3(
  :'EXPORT_QUERY',
    aws_commons.create_s3_uri(
    :'EXPORT_BUCKET_NAME',
    :'EXPORT_BUCKET_FILE_PATH',
    :'EXPORT_BUCKET_REGION'
  ),
  options := :'EXPORT_COPY_OPTIONS',
);
