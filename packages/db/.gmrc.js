const env = require("dotenv").config();
const initializeDatabase = require("./scripts/initDb");

if (env.error && process.env.DEPLOY_ENV === "local") {
  throw env.error;
}

const {
  DEPLOY_ENV,
  INIT_DATABASE,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  DATABASE_ROOT_USER,
  DATABASE_ROOT_USER_PASSWORD,
  DATABASE_OWNER,
  DATABASE_OWNER_PASSWORD,
} = process.env;

const PG_URL = `${DATABASE_HOST}:${DATABASE_PORT}`;

const isLocal = DEPLOY_ENV === "local";
const isInit = INIT_DATABASE === "true";

// Setting `application_name` in connection string for statistics and logging
const pgConnParams = `application_name=${isInit ? "db_init" : "graphile_migrate"}${
  !isLocal ? "&ssl=true&sslrootcert=../../data/amazon-rds-ca-bundle.pem" : ""
}`;

// Postgres/RDS default superuser role and application database
const rootConnectionString = `postgres://${DATABASE_ROOT_USER}:${DATABASE_ROOT_USER_PASSWORD}@${PG_URL}/${DATABASE_NAME}?${pgConnParams}`;

// Database owner role and application database
const ownerConnectionString = `postgres://${DATABASE_OWNER}:${DATABASE_OWNER_PASSWORD}@${PG_URL}/${DATABASE_NAME}?${pgConnParams}`;

// Database owner role and shadow application database for local development
const shadowConnectionString = `postgres://${DATABASE_OWNER}:${DATABASE_OWNER_PASSWORD}@${PG_URL}/${DATABASE_NAME}_shadow?${pgConnParams}`;

// Generated config setting comments from graphile-migrate init
/*
 * pgSettings: key-value settings to be automatically loaded into PostgreSQL
 * before running migrations, using an equivalent of `SET LOCAL <key> TO
 * <value>`
 */
const pgSettings = {
  search_path: "public, pf_public, pf_private, pf_hidden, graphile_worker, tiger",
};
/*
 * placeholders: substituted in SQL files when compiled/executed. Placeholder
 * keys should be prefixed with a colon and in all caps, like
 * `:COLON_PREFIXED_ALL_CAPS`. Placeholder values should be strings. They
 * will be replaced verbatim with NO ESCAPING AT ALL (this differs from how
 * psql handles placeholders) so should only be used with "safe" values. This
 * is useful for committing migrations where certain parameters can change
 * between environments (development, staging, production) but you wish to
 * use the same signed migration files for all.
 *
 * The special value "!ENV" can be used to indicate an environmental variable
 * of the same name should be used.
 *
 * Graphile Migrate automatically sets the `:DATABASE_NAME` and
 * `:DATABASE_OWNER` placeholders, and you should not attempt to override
 * these.
 */
const placeholders = {
  ":DATABASE_SUPERUSER": "!ENV", // Uses process.env.DATABASE_SUPERUSER
  ":DATABASE_ROOT_USER": "!ENV",
  ":GRAPHILE_ROLE": "!ENV",
  ":VISITOR_ROLE": "!ENV",
  ":AUTHENTICATED_ROLE": "!ENV",
  ":ADMIN_ROLE": "!ENV",
  ":PARTNER_ROLE": "!ENV",
};

/*
 * Actions allow you to run scripts or commands at certain points in the
 * migration lifecycle. SQL files are ran against the database directly.
 * "command" actions are ran with the following environmental variables set:
 *
 * - GM_DBURL: the PostgreSQL URL of the database being migrated
 * - GM_DBNAME: the name of the database from GM_DBURL
 * - GM_DBUSER: the user from GM_DBURL
 * - GM_SHADOW: set to 1 if the shadow database is being migrated, left unset
 *   otherwise
 *
 * If "shadow" is unspecified, the actions will run on events to both shadow
 * and normal databases. If "shadow" is true the action will only run on
 * actions to the shadow DB, and if false only on actions to the main DB.
 */

/* beforeReset: actions executed before deleting and recreating the database. */
const beforeReset = [];

/* afterReset: actions executed after a `graphile-migrate reset` command. */
const afterReset = [
  {
    _: "command",
    command: 'DATABASE_URL="$GM_DBURL" graphile-worker --schema-only',
  },
  "!init/0100-extensions.sql",
  "!afterReset.sql",
];

/* beforeAllMigrations: optional list of actions to execute before any pending migrations are executed. */
let beforeAllMigrations = [];

/* afterAllMigrations: actions executed once all migrations are complete. */
const afterAllMigrations = !isLocal
  ? []
  : // dump schema during local development
    [
      {
        _: "command",
        shadow: true,
        // Does not run when `IN_TESTS=1`
        command: "node scripts/dumpDb.js",
      },
    ];

/* beforeCurrent: optional list of actions to execute before current.sql is executed (i.e. in watch mode). */
const beforeCurrent = [];

/* afterCurrent: actions executed once the current migration has been evaluated (i.e. in watch mode). */
const afterCurrent = [];

/*
 * blankMigrationContent: content to be written to the current migration
 * after commit. NOTE: this should only contain comments.
 */
// const blankMigrationContent = "-- Write your migration here\n";

const gmrc = {
  connectionString: ownerConnectionString,
  shadowConnectionString,
  rootConnectionString,
  placeholders,
  pgSettings,
  beforeReset,
  afterReset,
  beforeAllMigrations,
  afterAllMigrations,
  beforeCurrent,
  afterCurrent,
};

module.exports = {
  ...gmrc,
  "//generatedWith": "1.0.2",
};
