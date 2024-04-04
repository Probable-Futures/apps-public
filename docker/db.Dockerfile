FROM postgis/postgis:12-master
COPY ./docker/db/init.sql /docker-entrypoint-initdb.d/
