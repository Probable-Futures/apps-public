import Coordinates from "../Coordinates";
import City from "../City";
import Address from "../Address";
import { CsvRow, Logger, RawCsvRow, PartnerDatasetCoordinates } from "../../../types";
import { errors, constants } from "../../../utils";

class ProcessedRow extends CsvRow {
  id: string;
  partnerDatasetId: string;
  coordinates: Coordinates;
  city?: City;
  address?: Address;
  parsedData: any;
  raw: RawCsvRow;
  logger: Logger;

  constructor({
    id,
    partnerDatasetId,
    raw,
    parsedData,
    coordinates,
    city,
    address,
    logger,
  }: {
    id: string;
    partnerDatasetId: string;
    raw: RawCsvRow;
    parsedData: {};
    city?: City;
    address?: Address;
    coordinates: Coordinates;
    logger: Logger;
  }) {
    super();
    this.id = id;
    this.partnerDatasetId = partnerDatasetId;
    this.logger = logger;
    this.raw = raw;
    this.parsedData = parsedData;
    this.coordinates = coordinates;
    this.city = city;
    this.address = address;
  }

  getDatasetCoordinateValues(): PartnerDatasetCoordinates {
    return [this.partnerDatasetId, this.id, this.coordinates.toWKT()];
  }

  validate() {
    try {
      this.coordinates.validate();

      if (!this.coordinates && !this.city && !this.address) {
        throw new errors.ValidationError({
          message: "No valid address or coordinates for row",
          invalidData: { ...this.raw },
        });
      }

      if (this.parsedData[constants.csvHeaders.validationErrors]) {
        throw this.parsedData[constants.csvHeaders.validationErrors];
      }
      return { valid: true, reasons: [] };
    } catch (error: any) {
      let reasons = [];
      const parsingError = this.parsedData[constants.csvHeaders.validationErrors];
      if (parsingError && parsingError.message !== error.message) {
        reasons.push(parsingError.message);
      }
      reasons.push(error.message);

      return { valid: false, reasons };
    }
  }

  export() {
    const row: any = {};
    row[constants.csvHeaders.rowId] = this.id;
    row[constants.csvHeaders.partnerDatasetId] = this.partnerDatasetId;
    const coordinates = this.coordinates.export();
    const city = this.city ? this.city.export() : {};
    const address = this.address ? this.address.export() : {};

    return {
      ...this.parsedData,
      ...coordinates,
      ...city,
      ...address,
      ...row,
    };
  }
}

export default ProcessedRow;
