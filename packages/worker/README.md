# @probable-futures/worker

We're using [graphile-worker](https://github.com/graphile/worker) job queue for our PostgreSQL database. It allows us to run jobs (e.g. sending emails, performing calculations, generating PDFs, etc) in the background.

## **Technologies used:**

- @mapbox/mapbox-sdk: used for forward geocoding.
- fast-csv: used for parsing and formatting CSVs.
- pg-format: used to create dynamic SQL queries.
- redis: used to cache geocoding results.
- pg-query-stream: used to stream select query result mainly to optimize memory usage when selecting large amounts of data.
- graphite-worker: job queue for PostgreSQL. Running jobs in the background.

## **Grapile-worker jobs:**

- ### pf_partner_dataset_upload

  1. #### Description:

     This task will be triggered by the database after inserting a record in the `pf_partner_dataset_upload` table.

     The objective of this task is to stream the dataset file uploaded by the users through the pf-pro website, read and validate the file, and push a new copy of the file to s3.

  2. #### Subtasks:

     1. ##### Geocode:

        The csv file might not contain coordinates, but instead contain country-city or country-city-address. This task uses `mbxGeocoding` from `@mabox/mabox-sdk` to perform forward geocoding and get the corresponding coordinates. The result of the geocoding, if valid, will be saved in the redis cache.

  3. #### How it works:

     This process streams the original file that was uploaded to S3.
     Following are the steps involved by the stream:

     1. Read: read the file given the path of the original file on S3.
     2. Parse: for every row being read, create a new `ParsedRow` instance
     3. Process: a new instance `ProcessedRow` will be created which holds the coordinates of a given row and does the Geocoding if necessary. For every row a new UUID field `partner_dataset_row_id` will be generated to be saved and used later on.
     4. Validate: a function that will be called on the `ProcessedRow` to check if the coordinates are set and the longitude/latitude are valid.
     5. After validation, all valid rows will be bulk inserted into the `pf_partner_dataset_coordinates` table as (`partner_dataset_id`, `partner_dataset_row_id`, `coordinates`)
     6. After all rows are inserted a new graphite worker will be added to the job’s queue: `add_nearby_pf_coordinates_to_partner_dataset`
     7. At the end of the process a new CSV file will be uploaded to S3 under `{partnerId}/processed/{uploadId}.csv`. This file contains all rows from the original file, alongside the parsed coordinates and the generated `partner_dataset_row_id`

- ### add_nearby_pf_coordinates_to_partner_dataset

  1.  #### Description:

      This task is triggered by the `process_partner_dataset` tasks after the processing is finished.
      The objective of this task is to find the nearest coordinate for relevant partner dataset coordinates and pf climate data.

  2.  #### How it works:
      1. Update all records that belong to the current dataset inside `pf_partner_dataset_coordinates` with PF RCM and GCM Coordinates (hashed). So, now for every record we have the coordinates hash from `pf_grid_coordinates table`, that we can use later to fetch climate data based on this hash*.*
      2. Start file streaming on the processed file uploaded during the `pf_partner_dataset_upload` process. The data from this file will be merged with the RCM and GCM Coordinates based on `partner_dataset_row_id`.
      3. Finally, a new CSV file will be created and uploaded to S3 under `{partnerId}/nearby-coordinates/{uploadId}.csv`.

- ### enrich_partner_dataset

  1.  #### Description:
      This task assigns the relevant climate data to every row inside the partner dataset.
  2.  #### How it works:

      1. The first is to select all the data from `partner_dataset_coordinates` and join with `aggregate_pf_dataset_statistics` using the coordinates hash in order to obtain the corresponding climate data.

      2. Fetch the nearby coordinates file from S3(that was created by the previous job)

      3. Finally, we merge the result of (i) and (ii) into `{partnerId}/enriched/{pfDatasetId}/{uploadId}.csv`, and upload it to S3.

  ![Alt text](enrichment-process.png?raw=true "Title")

## **Error handling**:

Different types of errors will be saved in the database and used by the client to display error messages.

- Unhandled Exception
- Validation Error
- Application Error
