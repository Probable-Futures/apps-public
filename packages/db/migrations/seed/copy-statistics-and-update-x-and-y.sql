create or replace function pf_hidden.copy_statistics_from_s3_and_update_x_and_y(environment text, dataset_id integer, batch_size integer)
returns text
language plpgsql as $fn$
declare
    error_message text;
    last_id integer := 0;
    rows_updated integer;
begin
    raise notice 'Starting import from S3 for environment: %, dataset_id: %', environment, dataset_id;

    raise notice 'Creating temporary table to hold CSV data';
    create TEMPORARY table temp_dataset_statistics (
        id serial primary key,
        dataset_id int,
        coordinate_hash text,
        warming_scenario citext,
        x numeric[]
    );

    perform aws_s3.table_import_from_s3(
        'temp_dataset_statistics',
        'dataset_id, coordinate_hash, warming_scenario, x',
        '(format csv, header true)',
        aws_commons.create_s3_uri(
          'global-pf-data-engineering',
          FORMAT('%s/postgres/copies/pf_public.pf_dataset_statistics_complete_stats/%s.csv', environment, dataset_id),
          'us-west-2'
        )
    );

    raise notice 'CSV data imported into temporary table';

    -- Loop to process data in batches
    loop
        raise notice 'Updating pf_public.pf_dataset_statistics table for batch starting after id %', last_id;

        with cte as (
            select tds.id, tds.dataset_id, tds.coordinate_hash, tds.warming_scenario, tds.x
            from temp_dataset_statistics tds
            where tds.id > last_id
            order by tds.id
            limit batch_size
        )
        update pf_public.pf_dataset_statistics ds
        set x = cte.x
        from cte
        where ds.dataset_id = cte.dataset_id
            and ds.coordinate_hash = cte.coordinate_hash
            and ds.warming_scenario = cte.warming_scenario;

        get diagnostics rows_updated = row_count;

        -- Exit loop if no more rows to process
        exit when rows_updated < batch_size;

        -- Retrieve the maximum ID from the updated rows
        select coalesce(max(id), last_id) into last_id from (
            select id
            from temp_dataset_statistics
            where id > last_id
            order by id
            limit batch_size
        ) as subquery;   
    end loop;

    raise notice 'pf_public.pf_dataset_statistics table updated successfully';

    raise notice 'Dropping temporary table';
    drop table temp_dataset_statistics;
    raise notice 'Temporary table dropped, function execution completed';

    return 'Update completed successfully';
exception
    when others then
        error_message := SQLERRM;
        if exists (select from pg_tables where tablename = 'temp_dataset_statistics') then
            raise notice 'An error occurred, dropping temporary table';
            drop table temp_dataset_statistics;
        end if;
        return format('An error occurred during the update: %s', error_message);
end;
$fn$;
