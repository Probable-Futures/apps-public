#!/usr/bin/env node

const util = require("util");
const exec = util.promisify(require("child_process").exec);

const LINE = "!-------------------------------------------------------------------------------!";
const ERROR_LINE =
  "!-------------------------------------ERROR-------------------------------------!";
const YARN_LINE =
  "!-----------------------------------YARN-OUTPUT---------------------------------!";
const PSQL_LINE = (fileName) =>
  `!-----------------------------------${fileName}---------------------------------!`;
const IMPORTANT_LINE =
  "!-----------------------------------IMPORTANT-----------------------------------!";

const log = (l) => {
  console.log();
  console.log(l);
  console.log();
};

const logError = (l) => {
  console.error();
  console.error(l);
  console.error();
};

const logImportant = (m) => {
  log(IMPORTANT_LINE);
  console.log(m);
  log(LINE);
};

const fatalError = (message, err) => {
  logError(ERROR_LINE);
  console.error("%s - Error: %o", message, err);
  logError(LINE);
  process.exit(1);
};

async function psqlVerifyInstall() {
  log('Verifying "psql" is installed...');

  try {
    const cmd = await exec("command -v psql 2>/dev/null && { echo >&1 psql; exit 0; }");
    return !!cmd.stdout;
  } catch (err) {
    fatalError("psql executable not found", err);
  }
}

async function psqlExecFile({ connectionString, templateVariables, fileName, extraFlags = [] }) {
  const flags = [
    "--echo-all",
    "--no-psqlrc",
    "--variable=ERROR_STOP=1",
    `--file=./migrations/init/${fileName}`,
    ...extraFlags,
  ];

  if (!!templateVariables && templateVariables.length > 0) {
    templateVariables.forEach((v) => flags.push(`--variable=${v[0]}=${v[1]}`));
  }

  try {
    const cmd = await exec(`psql ${flags.join(" ")} ${connectionString}`);
    log(PSQL_LINE(fileName));
    log(cmd.stdout);
    log(LINE);

    if (cmd.stderr.length > 0) {
      logError(cmd.stderr);
    }
  } catch (err) {
    console.error("Error executing PSQL for file: %s", fileName);
    throw err;
  }
}

async function installGraphileWorkerSchema(connectionString) {
  log("Installing graphile-worker schema...");

  try {
    const cmd = await exec(
      `yarn run graphile-worker --schema-only --connection ${connectionString}`,
    );

    log(YARN_LINE);
    log(cmd.stdout);
    log(LINE);

    if (cmd.stderr.length > 0) {
      logError(cmd.stderr);
    } else {
      log("Graphile-worker schema installed");
    }
  } catch (err) {
    logError(err);
    console.error("Installing graphile-worker schema returned non-zero status");
    console.error(
      'If `YARN-OUTPUT` states `error: duplicate key value violates unique constraint "pg_namespace_nspname_index"`',
    );
    console.error("Then the error can be safely ignored");
    console.error("see: https://stackoverflow.com/a/29908840");
  }
}

module.exports = async ({
  isLocal,
  dbName,
  dbOwnerRole,
  dbOwnerRolePassword,
  dbGraphileRole,
  dbGraphileRolePassword,
  dbVisitorRole,
  dbAuthenticatedRole,
  dbPartnerRole,
  dbAdminRole,
  dbSuperUserRole,
  dbRootRole,
  rootConnectionString,
  ownerConnectionString,
  templateConnectionString,
}) => {
  const deployEnvPrefix = isLocal ? "/local" : "/aws";

  // console.log(IMPORTANT_LINE);
  // console.log("dbName: %s", dbName);
  // console.log("dbOwnerRole: %s", dbOwnerRole);
  // console.log("dbOwnerRolePassword: %s", dbOwnerRolePassword);
  // console.log("dbGraphileRole: %s", dbGraphileRole);
  // console.log("dbGraphileRolePassword: %s", dbGraphileRolePassword);
  // console.log("dbVisitorRole: %s", dbVisitorRole);
  // console.log("dbAuthenticatedRole: %s", dbAuthenticatedRole);
  // console.log("dbSuperUserRole: %s", dbSuperUserRole);
  // console.log("rootConnectionString: %s", rootConnectionString);
  // console.log("ownerConnectionString: %s", ownerConnectionString);
  // console.log("templateConnectionString: %s", templateConnectionString);

  async function createDbOwner() {
    log(`Creating database owner role: ${dbOwnerRole}`);

    try {
      await psqlExecFile({
        connectionString: templateConnectionString,
        fileName: `${deployEnvPrefix}/0001-owner.sql`,
        templateVariables: [
          ["DATABASE_NAME", dbName],
          ["DATABASE_OWNER", dbOwnerRole],
          ["DATABASE_OWNER_PASSWORD", dbOwnerRolePassword],
          ["DATABASE_SUPERUSER", dbSuperUserRole],
          ["DATABASE_ROOT_USER", dbRootRole],
        ],
      });

      log("Database owner role created!");
    } catch (err) {
      fatalError("Database owner role creation failed", err);
    }
  }

  async function createPrimaryDatabase() {
    log(`Creating database: ${dbName}`);

    try {
      await psqlExecFile({
        connectionString: templateConnectionString,
        fileName: "0010-database.sql",
        templateVariables: [
          ["DATABASE_NAME", dbName],
          ["DATABASE_OWNER", dbOwnerRole],
          ["DATABASE_ROOT_USER", dbRootRole],
        ],
      });

      log("Database created!");
    } catch (err) {
      fatalError("Database creation failed", err);
    }
  }

  async function createExtensions() {
    log("Installing database extensions...");

    try {
      await psqlExecFile({
        connectionString: templateConnectionString,
        fileName: `0100-extensions.sql`,
        extraFlags: ["--single-transaction"],
      });

      log("Database extensions installed successfully!");
    } catch (err) {
      fatalError("Database extension install failed", err);
    }

    if (!isLocal) {
      try {
        log("Configuring production specific settings...");

        await psqlExecFile({
          connectionString: templateConnectionString,
          fileName: `${deployEnvPrefix}/0101-post-extensions.sql`,
          extraFlags: ["--single-transaction"],
        });

        log("Production extensions installed successfully!");
      } catch (err) {
        fatalError("Production extension install failed", err);
      }
    }
  }

  async function createServiceRoles() {
    log("Creating service roles...");

    try {
      await psqlExecFile({
        connectionString: rootConnectionString,
        fileName: "0020-service-roles.sql",
        templateVariables: [
          ["DATABASE_NAME", dbName],
          ["GRAPHILE_ROLE", dbGraphileRole],
          ["GRAPHILE_ROLE_PASSWORD", dbGraphileRolePassword],
          ["VISITOR_ROLE", dbVisitorRole],
          ["AUTHENTICATED_ROLE", dbAuthenticatedRole],
          ["ADMIN_ROLE", dbAdminRole],
          ["PARTNER_ROLE", dbPartnerRole],
        ],
        extraFlags: ["--single-transaction"],
      });
      log("Service roles created successfully!");
    } catch (err) {
      fatalError("Service role creation failed!", err);
    }
  }

  logImportant("Starting initDb.js script...");

  await psqlVerifyInstall();

  log("Initializing Postgres database...");

  await createDbOwner();
  await createExtensions();
  await createPrimaryDatabase();
  await createServiceRoles();
  await installGraphileWorkerSchema(ownerConnectionString);

  log("Database initialization finished!");
  logImportant("Please set DB_INIT=false before next migration");
};
