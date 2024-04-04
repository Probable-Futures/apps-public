#!/usr/bin/env node

const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const LINE = "!-------------------------------------------------------------------------------!";
const ERROR_LINE =
  "!-------------------------------------ERROR-------------------------------------!";
const PSQL_LINE = (fileName) =>
  `!-----------------------------------${fileName}---------------------------------!`;

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

const fatalError = (message, err) => {
  logError(ERROR_LINE);
  console.error("%s - Error: %o", message, err);
  logError(LINE);
  process.exit(1);
};

async function psqlVerifyInstall() {
  log('Verifying "psql" is installed...');
  try {
    const cmd = await exec(`command -v psql 2>/dev/null && { echo >&1 psql; exit 0; }`);
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
    `--file=${path.resolve(__dirname, "../migrations/seed/", fileName)}`,
    ...extraFlags,
  ];

  if (!!templateVariables && templateVariables.length > 0) {
    templateVariables.forEach((v) => flags.push(`--variable=${v[0]}="${v[1]}"`));
  }

  try {
    const cmd = await exec(`psql ${flags.join(" ")} "${connectionString}"`);
    log(PSQL_LINE(fileName));
    log(cmd.stdout);
    log(LINE);

    if (cmd.stderr.length > 0) {
      logError(cmd.stderr);
    }
  } catch (err) {
    fatalError(`Error executing PSQL for file: ${fileName}`, err);
  }
}

async function tableImportFromLocal({ connectionString, tableName, fileName, tableColumns }) {
  const flags = [
    `--command="\\copy ${tableName}(${tableColumns}) from '${path.resolve(
      __dirname,
      "../../../data/seeds/",
      fileName,
    )}' with (format CSV, HEADER);"`,
    "--echo-all",
    "--no-psqlrc",
    "--variable=ERROR_STOP=1",
  ];

  try {
    const cmd = await exec(`psql ${flags.join(" ")} "${connectionString}"`);
    log(PSQL_LINE(fileName));
    log(cmd.stdout);
    log(LINE);

    if (cmd.stderr.length > 0) {
      logError(cmd.stderr);
    }
  } catch (err) {
    fatalError(`Error executing PSQL for file: ${fileName}`, err);
  }
}

async function tableImportFromS3({
  bucketName,
  deployEnv,
  awsRegion,
  connectionString,
  tableName,
  fileName,
  tableColumns = "",
}) {
  // Remove backslashes
  const columns = tableColumns.replace(/\\/g, "");
  await psqlExecFile({
    connectionString,
    fileName: `table-import-from-s3.sql`,
    templateVariables: [
      ["IMPORT_TABLE_NAME", tableName],
      ["IMPORT_TABLE_COLUMNS", columns],
      ["IMPORT_BUCKET_NAME", bucketName],
      ["IMPORT_BUCKET_FILE_PATH", `${deployEnv}/postgres/copies/${fileName}`],
      ["IMPORT_BUCKET_REGION", awsRegion],
    ],
  });
}

async function tableImport(importArgs) {
  if (importArgs.deployEnv !== "local") {
    await tableImportFromS3(importArgs);
  } else {
    await tableImportFromLocal(importArgs);
  }
}

const baseImports = [
  {
    tableName: "pf_public.pf_datasets",
    tableColumns:
      "id, slug, name, description, model, unit, min_value, max_value, parent_category, sub_category, data_variables",
    fileName: "pf_public.pf_datasets.csv",
  },
  {
    tableName: "pf_public.pf_maps",
    tableColumns:
      'dataset_id, map_style_id, name, description, stops, bin_hex_colors, status, \\"order\\", is_diff, step, binning_type, bin_labels, slug, map_version, is_latest, data_labels, method_used_for_mid',
    fileName: "pf_public.pf_maps.csv",
  },
  {
    tableName: "pf_public.countries",
    tableColumns: "name, iso_a2, iso_a3, wkb_geometry",
    fileName: "pf_public.countries.csv",
  },
];

const statsImports = {
  // Sample size of 10k stats per database
  sampleFile: "pf_public.pf_dataset_statistics_sample.csv",
  fullFile: "pf_public.pf_dataset_statistics.csv",
  tableName: "pf_public.pf_dataset_statistics",
  tableColumns: "dataset_id, coordinate_hash, warming_scenario, low_value, mid_value, high_value",
};

const gridCoordinates = {
  tableName: "pf_public.pf_grid_coordinates",
  tableColumns: "grid, point",
  fileName: "pf_public.pf_grid_coordinates.csv",
};

module.exports = async ({
  awsRegion,
  bucketName,
  dbSeedTruncate,
  dbSeedSample,
  deployEnv,
  rootConnectionString,
}) => {
  console.log("Seeding database...");
  console.log("rootConnectionString", rootConnectionString);
  await psqlVerifyInstall();

  if (dbSeedTruncate === "true") {
    console.log("Truncating tables before seeding...");
    await psqlExecFile({
      connectionString: `${rootConnectionString}`,
      fileName: `pre-seed-truncate-tables.sql`,
    });
  }

  if (dbSeedSample === "true") {
    statsImports.fileName = statsImports.sampleFile;
    baseImports.push(statsImports);
    baseImports.push(gridCoordinates);
  }

  await psqlExecFile({
    connectionString: `${rootConnectionString}`,
    fileName: `pre-seed.sql`,
  });

  for await (let { tableName, tableColumns, fileName } of baseImports) {
    console.log();
    console.log(`${tableName}: Beginning seeding from ${fileName}`);
    await tableImport({
      connectionString: rootConnectionString,
      bucketName,
      deployEnv,
      awsRegion,
      tableName,
      tableColumns,
      fileName,
    });
    console.log();
    console.log(`${tableName}: Seeding successful`);
  }

  await psqlExecFile({
    connectionString: `${rootConnectionString}`,
    fileName: `post-seed.sql`,
  });

  console.log(`Seeding complete!`);
  process.exit(0);
};
