import * as csv from "fast-csv";
import { Logger } from "./shared";

type PartnerDatasetId = string;
type PartnerDatasetRowId = string;

export type RawCsvRow = csv.ParserRow<string> | { [key: string]: string };
export type DatasetEnrichmentStatus = "requested" | "in progress" | "failed" | "successful";
export type WKTCoordinates = string;
export type PartnerDatasetCoordinates = [PartnerDatasetId, PartnerDatasetRowId, WKTCoordinates];

export interface NearbyCoordinateResult {
  coordinate_hash: string;
  latitude: number;
  longitude: number;
}

export type CoordinateGridModel = "GCM" | "RCM";

export type NearbyCoordinatesGridResults = Record<CoordinateGridModel, NearbyCoordinateResult>;

type RowId = string;

export type NearbyCoordinatesMap = Map<RowId, NearbyCoordinatesGridResults>;

type data_baseline_low = number;
type data_baseline_mid = number;
type data_baseline_high = number;
type data_1c_low = number;
type data_1c_mid = number;
type data_1c_high = number;
type data_1_5c_low = number;
type data_1_5c_mid = number;
type data_1_5c_high = number;
type data_2c_low = number;
type data_2c_mid = number;
type data_2c_high = number;
type data_2_5c_low = number;
type data_2_5c_mid = number;
type data_2_5c_high = number;
type data_3c_low = number;
type data_3c_mid = number;
type data_3c_high = number;

export interface EnrichmentWithCombinedData {
  row_id: string;
  pf_rcm_coordinate_hash: string;
  data: [
    data_baseline_low,
    data_baseline_mid,
    data_baseline_high,
    data_1c_low,
    data_1c_mid,
    data_1c_high,
    data_1_5c_low,
    data_1_5c_mid,
    data_1_5c_high,
    data_2c_low,
    data_2c_mid,
    data_2c_high,
    data_2_5c_low,
    data_2_5c_mid,
    data_2_5c_high,
    data_3c_low,
    data_3c_mid,
    data_3c_high,
  ];
}

export interface EnrichmentData {
  row_id: string;
  pf_rcm_coordinate_hash: string;
  pf_gcm_coordinate_hash: string;
  data_baseline_low: number;
  data_baseline_mid: number;
  data_baseline_high: number;
  data_1c_low: number;
  data_1c_mid: number;
  data_1c_high: number;
  data_1_5c_low: number;
  data_1_5c_mid: number;
  data_1_5c_high: number;
  data_2c_low: number;
  data_2c_mid: number;
  data_2c_high: number;
  data_2_5c_low: number;
  data_2_5c_mid: number;
  data_2_5c_high: number;
  data_3c_low: number;
  data_3c_mid: number;
  data_3c_high: number;
}

export interface EnrichedMap {
  [rowId: string]: EnrichmentWithCombinedData;
}

export type InvalidRow<T> = { row: T; reason?: string; rowNumber: number };

export abstract class RawRow {
  abstract raw: RawCsvRow;
}

export abstract class CsvRow extends RawRow {
  abstract logger: Logger;

  abstract export(): any;

  toObject() {
    return Object.assign({}, this);
  }

  toArray() {
    return Object.entries(this.toObject());
  }

  print(message?: string) {
    this.logger.info("%o", { message, ...this.toObject() } as any);
  }
}
