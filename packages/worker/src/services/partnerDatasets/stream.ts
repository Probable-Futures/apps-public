import * as csv from "fast-csv";
import AWS from "aws-sdk";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { pipeline } from "stream/promises";
import { randomUUID } from "crypto";
import { env, extendDebugger } from "../../utils";
import * as aws from "../aws";
import * as types from "../../types";

const PARTNER_DATASET_BUCKET = env.AWS_S3_BUCKET;

const debug = extendDebugger("services:partner:datasets:stream");

type ReadStreamArgs = { file: string };

// Download the S3 object fully to a local temp file before parsing.
// Parsing against an S3 read stream can stall the HTTP connection when the
// CSV transform is slow (e.g., per-row Mapbox geocoding); AWS closes idle
// connections after ~2 min, which truncates the input and silently ends the
// parser mid-row. Draining the object to disk decouples download from parse.
const downloadDatasetToTempFile = async ({ file }: ReadStreamArgs): Promise<string> => {
  const tempPath = path.join(os.tmpdir(), `pf-dataset-${randomUUID()}.csv`);
  debug("downloadDatasetToTempFile: %s -> %s", file, tempPath);
  const readStream = aws.s3.readObjectStream({
    Bucket: PARTNER_DATASET_BUCKET,
    Key: file,
  });
  try {
    await pipeline(readStream, fs.createWriteStream(tempPath));
    return tempPath;
  } catch (err) {
    await fs.promises.unlink(tempPath).catch(() => {});
    console.error("Failed to download dataset to temp file: %s", file);
    console.error(err);
    throw err;
  }
};

const pathPrefix = env.isLocal && env.isDev ? "local-development/" : "";
type WriteStreamArgs = { path: string; file: string };
const writeDatasetStream = ({ path, file }: WriteStreamArgs) => {
  debug("writeDatasetStream");
  try {
    const { writeStream, uploadManager } = aws.s3.writeObjectStream({
      Bucket: PARTNER_DATASET_BUCKET,
      Key: `${pathPrefix}${path}/${file}`,
      ACL: "private",
      ContentType: "text/csv",
    });
    return { writeStream, uploadManager };
  } catch (err) {
    console.error("Failed to open write stream to path: %s file: %s", path, file);
    console.error(err);
    throw err;
  }
};

type ParseCsvStreamArgs<I extends csv.ParserRow, O extends types.CsvRow> = {
  validate?: csv.ParserRowValidate<O>;
  transform: {
    row?: csv.ParserRowTransformFunction<I, O>;
    header?: csv.ParserHeaderTransformFunction | boolean;
  };
  eventHandlers: {
    headers?: (headers: csv.ParserHeaderArray) => void;
    data?: (row: O) => void;
    invalidData?: (row: O, rowNumber: number, reason?: string) => void;
    error?: (e?: Error) => void;
    end?: (rowCount: number) => void;
  };
};

const noop = (): void => {};
const validateNoop = (r: any) => true;

function parseCsvStream<I extends csv.ParserRow, O extends types.CsvRow>({
  validate = validateNoop,
  transform: { row = noop, header = false },
  eventHandlers: { headers = noop, data = noop, invalidData = noop, error = noop, end = noop },
}: ParseCsvStreamArgs<I, O>): csv.CsvParserStream<I, O> {
  debug("parseCsvStream");
  try {
    const parseStream = csv
      .parse<I, O>({ headers: header })
      .transform(row)
      .validate(validate)
      .on("headers", headers)
      .on("error", error)
      .on("data-invalid", invalidData)
      .on("data", data)
      .on("end", end);
    return parseStream;
  } catch (err) {
    console.error("failed to create parserStream");
    console.error(err);
    throw err;
  }
}

type WriteSteamHandlers = {
  httpUploadProgress: (progress: AWS.S3.ManagedUpload.Progress) => void;
};

type StreamDatasetsArgs<I extends csv.ParserRow, O extends types.CsvRow> = {
  read: ReadStreamArgs;
  parse: ParseCsvStreamArgs<I, O>;
  write: WriteStreamArgs & WriteSteamHandlers;
};
export async function streamCsvDatasets<I extends csv.ParserRow, O extends types.CsvRow>({
  read,
  parse,
  write,
}: StreamDatasetsArgs<I, O>): Promise<{
  headers: csv.ParserHeaderArray;
  rowCount: number;
  invalidRows: types.InvalidRow<types.RawRow>[];
  errors: any[];
  writeFileLocation: string;
}> {
  debug("streamCsvDatasets read: %o", read);
  const tempPath = await downloadDatasetToTempFile(read);
  const cleanupTempFile = () =>
    fs.promises.unlink(tempPath).catch((err) => {
      debug("failed to remove temp file %s: %o", tempPath, err);
    });

  return new Promise<{
    headers: csv.ParserHeaderArray;
    rowCount: number;
    invalidRows: types.InvalidRow<types.RawRow>[];
    errors: any[];
    writeFileLocation: string;
  }>((resolve, reject) => {
    let headers: csv.ParserHeaderArray;
    let rowCount: number = 0;
    let invalidRows: types.InvalidRow<types.RawRow>[] = [];
    let errors: any[] = [];
    let writeFileLocation: string;
    const readStream = fs.createReadStream(tempPath);

    const { writeStream, uploadManager } = writeDatasetStream({
      file: write.file,
      path: write.path,
    });

    const formatStream = csv.format<I, O>({ headers: true });

    const parseStream = parseCsvStream<I, O>({
      validate: parse.validate,
      transform: parse.transform,
      eventHandlers: {
        headers: (h) => {
          debug("headers %o", h);
          headers = h;
          if (parse.eventHandlers.headers) {
            parse.eventHandlers.headers(h);
          }
        },
        data: (row) => {
          // debug("data %o", row);
          if (parse.eventHandlers.data) {
            parse.eventHandlers.data(row);
          }
          // Write the plain object so fast-csv matches columns by key.
          // Passing Object.entries(...) makes fast-csv treat it as a "hash array"
          // and align values by position, which silently corrupts rows whose
          // exported key order differs from the first row's.
          formatStream.write(row.export());
        },
        invalidData: (row, rowNumber, reason) => {
          debug("invalidData row: %o row#: %i, reason: %s", row, rowNumber, reason);
          if (parse.eventHandlers.invalidData) {
            parse.eventHandlers.invalidData(row, rowNumber, reason);
          }
          invalidRows.push({ row: { raw: row.raw }, rowNumber, reason });
        },
        error: (e) => {
          debug("error: %o", e);
          if (parse.eventHandlers.error) {
            parse.eventHandlers.error(e);
          }
          errors.push(e);
        },
        end: (c) => {
          debug("end: %i", c);
          if (parse.eventHandlers.end) {
            parse.eventHandlers.end(c);
          }
          rowCount = c;
          formatStream.end();
        },
      },
    });

    //@ts-ignore
    uploadManager.send((error, data) => {
      debug("streamCsvDatasets: uploadManager");
      if (error) {
        console.error("uploadManager Error: %o", error);
        reject(error);
      } else {
        debug("streamCsvDatasets: uploadManager success");
        writeFileLocation = data.Location;

        //@ts-ignore
        resolve({ rowCount, invalidRows, headers, errors, writeFileLocation });
      }
    });

    //@ts-ignore
    uploadManager.on("httpUploadProgress", write.httpUploadProgress);

    readStream.on("error", (err) => {
      debug("readStream: error %o", err);
      reject(err);
    });

    //@ts-ignore
    readStream
      .pipe(parseStream)
      .on("error", (err) => {
        debug("parseCsvDatasets: error %o", err);
        reject(err);
      })
      .on("finish", () => {
        debug("parseCsvDatasets: success");
      });

    formatStream
      .pipe(writeStream)
      .on("error", (err) => {
        debug("formatCsvDatasets: error %o", err);
        reject(err);
      })
      .on("finish", () => {
        debug("formatCsvDatasets: success");
      });
  }).finally(cleanupTempFile);
}
