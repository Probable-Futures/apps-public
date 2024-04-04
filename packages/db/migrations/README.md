# Migrations

This folder contains the database migrations. We're using the `graphile-migrate`
project to produce these; we highly recommend you read the README before
implementing your own migrations:

https://github.com/graphile/migrate/blob/main/README.md

The main file you'll be working with is `current.sql`.

## current.sql

This is where your new database changes go. They need to be idempotent (for
details read the README above). The `graphile-migrate watch` command will automatically
watch this file and re-run it whenever it changes, updating your database in
realtime.

## committed

When you're happy with the changes you have made, you can commit your migration by running the following command:

```
DATABASE_URL={DATABASE_URL} SHADOW_DATABASE_URL={SHADOW_DATABASE_URL} ROOT_DATABASE_URL={ROOT_DATABASE_URL} yarn commit
```

Those env variables are required by `graphile-migrate commit` command. Their values can be found in `packages/db/.env`. Make sure to replace the host in those variables from `db` to `localhost` because you're now running the command outside the docker network.

Running `yarn commit` moves the content of `current.sql`
into the `committed` folder, and hashes it to prevent later modifications (which should instead be done with additional migrations).
