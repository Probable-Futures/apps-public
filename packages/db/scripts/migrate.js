#!/usr/bin/env node

const env = require("dotenv").config();
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const initializeDatabase = require("./initDb");
const seedDatabase = require("./seed");

if (env.error && process.env.DEPLOY_ENV === "local") {
  throw env.error;
}

const {
  DEPLOY_ENV,
  AWS_REGION,
  SEED_BUCKET,
  DB_SEED,
  DB_SEED_TRUNCATE,
  DB_SEED_SAMPLE,
  INIT_DATABASE,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  DATABASE_ROOT_USER,
  DATABASE_ROOT_USER_PASSWORD,
  DATABASE_OWNER,
  DATABASE_OWNER_PASSWORD,
  GRAPHILE_ROLE,
  GRAPHILE_ROLE_PASSWORD,
  VISITOR_ROLE,
  DATABASE_SUPERUSER,
  AUTHENTICATED_ROLE,
  PARTNER_ROLE,
  ADMIN_ROLE,
} = process.env;

const PG_URL = `${DATABASE_HOST}:${DATABASE_PORT}`;

const isLocal = DEPLOY_ENV === "local";
const isInit = INIT_DATABASE === "true";

// Setting `application_name` in connection string for statistics and logging
const pgConnParams = `application_name=${isInit ? "db_init" : "graphile_migrate"}${
  !isLocal ? "&ssl=true&sslrootcert=../../data/amazon-rds-ca-bundle.pem" : ""
}`;

// Postgres/RDS default superuser role and database
const templateConnectionString = `postgres://${DATABASE_ROOT_USER}:${DATABASE_ROOT_USER_PASSWORD}@${PG_URL}/template1?${pgConnParams}`;

// Postgres/RDS default superuser role and application database
const rootConnectionString = `postgres://${DATABASE_ROOT_USER}:${DATABASE_ROOT_USER_PASSWORD}@${PG_URL}/${DATABASE_NAME}?${pgConnParams}`;

// Database owner role and application database
const ownerConnectionString = `postgres://${DATABASE_OWNER}:${DATABASE_OWNER_PASSWORD}@${PG_URL}/${DATABASE_NAME}?${pgConnParams}`;

async function initialize() {
  try {
    console.log("Begin database initialization...");
    await initializeDatabase({
      isLocal,
      rootConnectionString,
      ownerConnectionString,
      templateConnectionString,
      dbName: DATABASE_NAME,
      dbOwnerRole: DATABASE_OWNER,
      dbOwnerRolePassword: DATABASE_OWNER_PASSWORD,
      dbGraphileRole: GRAPHILE_ROLE,
      dbGraphileRolePassword: GRAPHILE_ROLE_PASSWORD,
      dbVisitorRole: VISITOR_ROLE,
      dbAuthenticatedRole: AUTHENTICATED_ROLE,
      dbAdminRole: ADMIN_ROLE,
      dbSuperUserRole: DATABASE_SUPERUSER,
      dbPartnerRole: PARTNER_ROLE,
      dbRootRole: DATABASE_ROOT_USER,
    });
  } catch (err) {
    console.error("Database initialization failed");
    console.error("Error: %o", err);
    process.exit(1);
  }
}
async function migrate(watch) {
  try {
    console.log("Begin database migration...");
    const cmd = watch === true ? "watch" : "migrate";
    const migration = await exec(`yarn graphile-migrate ${cmd}`);

    console.log(migration.stdout);

    if (migration.stderr.length > 0) {
      console.error("Migration error: %s", migration.stderr);
      process.exit(1);
    } else {
      console.log("Migration finished");
    }
  } catch (err) {
    console.error("Migration error: %o", err);
    process.exit(1);
  }
}

async function seed() {
  try {
    console.log("Begin database seeding...");
    await seedDatabase({
      awsRegion: AWS_REGION,
      bucketName: SEED_BUCKET,
      dbSeedTruncate: DB_SEED_TRUNCATE,
      dbSeedSample: DB_SEED_SAMPLE,
      deployEnv: DEPLOY_ENV,
      rootConnectionString,
    });
  } catch (err) {
    console.error("Database seeding failed");
    console.error("Error: %o", err);
    process.exit(1);
  }
}

(async function main() {
  if (!isInit) {
    await migrate(true);
    process.exit(0);
  }

  await initialize();
  await migrate();
  if (DB_SEED === "true") {
    await seed();
    if (isLocal) {
      // watch on local development
      await migrate(true);
    }
  }

  process.exit(0);
})();
