# @probable-futures/db

We're using [PostgreSQL](https://www.postgresql.org/) database to store the list of available datasets along with their raw data as well as the metadata for the maps created in Mapbox.

This is a diagram of the database schema. This was created using dbdiagram.io. To see the full schema, [view the diagram in the browser on dbdiagram.io](https://dbdiagram.io/d/620e2a84485e433543cc563f). To edit the diagram, copy the schema from dbdiagram.io, paste it into a new diagram in your own account, and edit the schema. Please remember to replace this link to the schama and the image below after doing so.

![PF-DB](https://user-images.githubusercontent.com/18680770/227206760-7b906d2f-3f60-468a-8ac0-aacc0e3b95e7.png)

## Migrations

We're using [graphile-migrate](https://github.com/graphile/migrate) tool to manage the migrations in this project. Check the [README](migrations/README.md) in `migrations` folder for more info.

## How to seed the the database with geojson data from the internet

1. Download org2org from gdal's main site
2. Run this command on the geojson file you have: `ogrinfo -so -al ${PATH_TO_GEOJSON_FILE}.json`. This will validate the geojson and returns metdata including the driver that will be used by org2org during data conversion
3. Run the command to save the geo data in your table:
   `ogr2ogr -f "PostgreSQL" PG:"host=${HOST} port=${PORT} dbname=${DB} user=${DB_USER} password=${DB_PASSWORD}" \
"${PATH_TO_GEOJSON_FILE}.json" -nln "${DB_TABLE_NAME}" -lco GEOMETRY_NAME=wkb_geometry \
-nlt MULTIPOLYGON`
4. Select the data you want and save into targeted table, eg.
   `INSERT INTO pf_public.geo_places (name, wkb_geometry, geo_place_type, properties)
SELECT coty_name[1], ST_SetSRID(wkb_geometry, 4326) AS wkb_geometry, 'county' AS geo_place_type, jsonb_build_object('state name', ste_name[1]) AS properties
    FROM pf_public.counties2;`
5. copy the newly imported data into a CSV file, then use it to seed tables in any database evironment:
   `\copy (select name,iso_a2,iso_a3,wkb_geometry,geo_place_type from pf_public.geo_places where geo_place_type='state' order by name desc) to '/Users/moustafawehbe/work/seed-files/pf_public.geo_places_states.csv' csv header`
6. Finally, copy the data from the CSV into the database:
   `\copy pf_public.geo_places (name,iso_a2,iso_a3,wkb_geometry,geo_place_type) from '/Users/moustafawehbe/work/seed-files/pf_public.geo_places_states.csv' with (format CSV, HEADER);`
