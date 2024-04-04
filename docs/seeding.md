# Seeding

Because the climate datasets are so large, database content is loaded separately
from the migrations.
Rather than running the netCDF importer to load every dataset, we have exported
the datasets as CSVs and
use the Postgres `COPY` commands to load the CSVs as tables.

## S3 Bucket

The data resides in the `global-pf-data-engineering` bucket.
The bucket contains folders for `local`, `development`, `staging` and `production`. These environment
specific folders were created to enable testing changes to the seeding data
without impacting the data integrity of other environments.

Each environment folder contains a `postgres/copies` folder containing the seed data.
Each CSV file is named after the postgres table that it is used to seed, with
one expection.
The `pf_public.pf_dataset_statistics` is very large, so in addition to the
csv containing all the data
there is a `pf_public.pf_dataset_statistics_sample.csv` limited to 10k
statisics per PF dataset.
Additionally, the `pf_public.pf_dataset_statistics_sample` folder in s3 contains
csv seeds for each PF dataset.
This enables selective loading of datasets.

The 3GB `pf_public.pf_dataset_statistics.csv` should not be used for seeding. It
can take serveral days to load and insert the data from the file into postgres.

## Seeding Local Databases

To see your local database, you first need to download the csv from s3. This can
be accomplished in multiple ways.

- Download the csv files from the aws s3 console UI.
- Use the `awscli` to copy the files locally. Eg: `aws s3 cp s3://global-pf-data-engineering/development/postgres/copies/pf_public.pf_dataset_statistics_sample.csv ./data/seeds`
- Use [rclone](https://rclone.org/commands/rclone_sync/) to sync the folder to
  your local `/data/seeds` directory

After you've downloaded the files they need to be added to the `data/seeds`
directory in order for the seeding script to automatically seed the database
after initialization and migration.

Your directory should look like this:

```
data/seeds
├── pf_public.pf_dataset_statistics_sample.csv
├── pf_public.pf_datasets.csv
├── pf_public.pf_grid_coordinates.csv
└── pf_public.pf_maps.csv
```

## Seeding AWS Databases

Non-local databases are seeded differently than the local database. On AWS, Postgres has a special extension for
importing and exporting tables from s3 buckets. Here is an example of how to use the function you need to seed a database on AWS.

```sql
select * from aws_s3.table_import_from_s3(
  'pf_public.pf_dataset_statistics',
  'dataset_id, coordinate_hash, warming_scenario, low_value, mid_value, high_value',
  '(format csv, header)',
  aws_commons.create_s3_uri(
    'global-pf-data-engineering',
    'development/postgres/copies/pf_public.pf_dataset_statistics/40101.csv',
    'us-west-2'
  )
);
```
