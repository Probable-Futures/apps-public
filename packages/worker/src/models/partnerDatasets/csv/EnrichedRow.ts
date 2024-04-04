import {
  Logger,
  RawCsvRow,
  CsvRow,
  EnrichmentData,
  EnrichmentWithCombinedData,
} from "../../../types";
import NearbyCoordinates from "../NearbyCoordinates";
import { constants, errors } from "../../../utils";

class EnrichedRow extends CsvRow {
  id: string;
  partnerDatasetId: string;
  pfDatasetId: number;
  parsedData: any;
  raw: RawCsvRow;
  logger: Logger;
  enrichedData?: EnrichmentWithCombinedData;
  nearbyPFCoordinates: NearbyCoordinates;

  constructor({
    partnerDatasetId,
    pfDatasetId,
    raw,
    logger,
  }: {
    partnerDatasetId: string;
    pfDatasetId: number;
    raw: RawCsvRow;
    logger: Logger;
  }) {
    super();
    this.partnerDatasetId = partnerDatasetId;
    this.pfDatasetId = pfDatasetId;
    this.raw = raw;
    this.logger = logger;
    const { id, nearbyPFCoordinates, ...parsedData } = this.parseRawRow(raw);
    this.id = id;
    this.nearbyPFCoordinates = nearbyPFCoordinates;
    this.parsedData = parsedData;
  }

  addEnrichedData(data: EnrichmentWithCombinedData) {
    this.enrichedData = data;
  }

  validate() {
    const valid = !!this.enrichedData;
    const reasons = [];

    if (!valid) {
      reasons.push("Unable to match enrichment data");
    }

    return { valid, reasons };
  }

  export() {
    let enriched: any = {};
    if (this.enrichedData) {
      enriched = {
        row_id: this.enrichedData.row_id,
        data_baseline_low: this.enrichedData.data[0],
        data_baseline_mid: this.enrichedData.data[1],
        data_baseline_high: this.enrichedData.data[2],
        data_1c_low: this.enrichedData.data[3],
        data_1c_mid: this.enrichedData.data[4],
        data_1c_high: this.enrichedData.data[5],
        data_1_5c_low: this.enrichedData.data[6],
        data_1_5c_mid: this.enrichedData.data[7],
        data_1_5c_high: this.enrichedData.data[8],
        data_2c_low: this.enrichedData.data[9],
        data_2c_mid: this.enrichedData.data[10],
        data_2c_high: this.enrichedData.data[11],
        data_2_5c_low: this.enrichedData.data[12],
        data_2_5c_mid: this.enrichedData.data[13],
        data_2_5c_high: this.enrichedData.data[14],
        data_3c_low: this.enrichedData.data[15],
        data_3c_mid: this.enrichedData.data[16],
        data_3c_high: this.enrichedData.data[17],
      };
      delete this.enrichedData;
    }

    return {
      ...this.parsedData,
      ...enriched,
    };
  }

  private parseRawRow(raw: any) {
    const id = raw[constants.csvHeaders.rowId];
    const partnerDatasetId = raw[constants.csvHeaders.partnerDatasetId];
    if (!id) {
      throw new errors.ApplicationError({
        message: `Row missing required field: ${constants.csvHeaders.rowId}`,
      });
    }
    if (!partnerDatasetId) {
      throw new errors.ApplicationError({
        message: `Row missing required field: ${constants.csvHeaders.partnerDatasetId}`,
      });
    }
    delete raw[constants.csvHeaders.rowId];
    delete raw[constants.csvHeaders.partnerDatasetId];
    delete raw[constants.csvHeaders.nearbyCoordinates.RCM.hash];
    delete raw[constants.csvHeaders.nearbyCoordinates.RCM.lat];
    delete raw[constants.csvHeaders.nearbyCoordinates.RCM.lon];

    delete raw[constants.csvHeaders.nearbyCoordinates.GCM.hash];
    delete raw[constants.csvHeaders.nearbyCoordinates.GCM.lat];
    delete raw[constants.csvHeaders.nearbyCoordinates.GCM.lon];

    const nearbyPFCoordinates = new NearbyCoordinates(raw, true);
    const { valid, reasons } = nearbyPFCoordinates.validate();
    if (!valid) {
      throw new errors.ApplicationError({
        message: `Error parsing coordinates: ${reasons}`,
      });
    }

    return { id, nearbyPFCoordinates, ...raw };
  }
}

export default EnrichedRow;
