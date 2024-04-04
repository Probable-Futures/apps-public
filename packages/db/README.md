# @probable-futures/db

We're using [PostgreSQL](https://www.postgresql.org/) database to store the list of available datasets along with their raw data as well as the metadata for the maps created in Mapbox.

This is a diagram of the database schema, created by Wajeeh Zantout. This was created using dbdiagram.io. To see the full schema, [view the diagram in the browser on dbdiagram.io](https://dbdiagram.io/d/620e2a84485e433543cc563f). To edit the diagram, copy the schema from dbdiagram.io, paste it into a new diagram in your own account, and edit the schema. Please remember to replace this link to the schama and the image below after doing so.

![PF-DB](https://user-images.githubusercontent.com/18680770/227206760-7b906d2f-3f60-468a-8ac0-aacc0e3b95e7.png)

## Migrations

We're using [graphile-migrate](https://github.com/graphile/migrate) tool to manage the migrations in this project. Check the [README](migrations/README.md) in `migrations` folder for more info.
