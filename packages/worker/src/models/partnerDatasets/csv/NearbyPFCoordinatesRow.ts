import { NearbyCoordinatesGridResults, Logger, RawCsvRow, CsvRow } from "../../../types";
import NearbyCoordinates from "../NearbyCoordinates";
import { constants, errors } from "../../../utils";

class NearbyPFCoordinatesRow extends CsvRow {
  id: string;
  partnerDatasetId: string;
  parsedData: any;
  raw: RawCsvRow;
  logger: Logger;
  nearbyPFCoordinate?: NearbyCoordinates;

  constructor({
    partnerDatasetId,
    raw,
    logger,
  }: {
    partnerDatasetId: string;
    raw: RawCsvRow;
    logger: Logger;
  }) {
    super();
    this.partnerDatasetId = partnerDatasetId;
    this.raw = raw;
    this.logger = logger;
    const { id, ...parsedData } = this.parseRawRow(raw);
    this.id = id;
    this.parsedData = parsedData;
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
    return { ...raw, id };
  }

  setNearbyPFCoordinates(coords: NearbyCoordinatesGridResults) {
    this.nearbyPFCoordinate = new NearbyCoordinates(coords, false);
  }

  validate() {
    let valid = true;
    const reasons = [];

    if (!this.nearbyPFCoordinate) {
      valid = false;
      reasons.push("Unable to find nearby coordinates");
    }

    if (valid) {
      const coordValidation = this.nearbyPFCoordinate?.validate();
      valid = !!coordValidation?.valid;

      if (coordValidation?.reasons) {
        reasons.concat(coordValidation.reasons);
      }
    }

    return { valid, reasons };
  }
  export() {
    const row: any = {};
    let coordinates: any = {};
    if (this.nearbyPFCoordinate) {
      coordinates = this.nearbyPFCoordinate.export();
    }
    row[constants.csvHeaders.rowId] = this.id;
    row[constants.csvHeaders.partnerDatasetId] = this.partnerDatasetId;
    return {
      ...this.parsedData,
      ...row,
      ...coordinates,
    };
  }
}

export default NearbyPFCoordinatesRow;
