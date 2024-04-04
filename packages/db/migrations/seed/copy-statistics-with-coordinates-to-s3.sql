create type pf_hidden.query_export_to_s3_response as (
	rows_uploaded integer,
	files_uploaded integer,
	bytes_uploaded integer
);

drop function if exists pf_hidden.export_dataset_statistics_with_coordinates;
create or replace function pf_hidden.export_dataset_statistics_with_coordinates(environment text, dataset_id integer)
  returns pf_hidden.query_export_to_s3_response
  as $$
  declare
    response pf_hidden.query_export_to_s3_response;
  begin
  select * from aws_s3.query_export_to_s3(
    query => format(
      'select * from (
        select (ST_X(gc.point::geometry)) as longitude,
          (ST_Y(gc.point::geometry)) as latitude,
          (ST_AsGeoJSON(gc.cell::geometry, 1)::json)->''coordinates'' as cell,
          stats.data_baseline_low as low_value_0_5C,
          stats.data_baseline_mid as mid_value_0_5C,
          stats.data_baseline_high as high_value_0_5C,
          stats.data_1c_low as low_value_1C,
          stats.data_1c_mid as mid_value_1C,
          stats.data_1c_high as high_value_1C,
          stats.data_1_5c_low as low_value_1_5C,
          stats.data_1_5c_mid as mid_value_1_5C,
          stats.data_1_5c_high as high_value_1_5C,
          stats.data_2c_low as low_value_2C,
          stats.data_2c_mid as mid_value_2C,
          stats.data_2c_high as high_value_2C,
          stats.data_2_5c_low as low_value_2_5C,
          stats.data_2_5c_mid as mid_value_2_5C,
          stats.data_2_5c_high as high_value_2_5C,
          stats.data_3c_low as low_value_3C,
          stats.data_3c_mid as mid_value_3C,
          stats.data_3c_high as high_value_3C
        from pf_private.aggregate_pf_dataset_statistics stats
        join pf_public.pf_grid_coordinates gc on stats.coordinate_hash = gc.md5_hash
        where stats.dataset_id = %L) as t
      order by t.longitude, t.latitude', dataset_id
    ),
    bucket => 'global-pf-data-engineering', 
    file_path => format(
      '%s/postgres/climate-data-csvs-with-coordinates/%s.csv', environment, (select slug from pf_public.pf_maps m where m.dataset_id = export_dataset_statistics_with_coordinates.dataset_id limit 1)
    ), 
    region => 'us-west-2', 
    options => 'format csv, header') into response;
    return response;
  end;
$$ language plpgsql;

comment on function pf_hidden.export_dataset_statistics_with_coordinates(environment text, dataset_id integer) is E'Helper function to export dataset statistics from db to s3 including coordinates and cell boundaries';
