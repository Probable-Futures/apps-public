import { v4 as uuidv4 } from "uuid";
import { CsvRow, RawCsvRow, Logger, Geodata } from "../../../types";
import { constants } from "../../../utils";
import City from "../City";
import Address from "../Address";
import Coordinates from "../Coordinates";
import ProcessedRow from "./ProcessedRow";
import { csvPlaceColumns } from "../../../utils/constants";

class ParsedRow extends CsvRow {
  id: string;
  partnerDatasetId: string;
  coordinates?: Coordinates;
  city?: City;
  address?: Address;
  parsedData: any;
  raw: RawCsvRow;
  logger: Logger;
  geodataType: Geodata;

  constructor({
    partnerDatasetId,
    raw,
    logger,
    geodataType,
  }: {
    partnerDatasetId: string;
    raw: RawCsvRow;
    logger: Logger;
    geodataType: Geodata;
  }) {
    super();
    this.id = uuidv4();
    this.partnerDatasetId = partnerDatasetId;
    this.raw = raw;
    this.logger = logger;
    this.geodataType = geodataType;
    this.parse();
  }

  async process(): Promise<ProcessedRow> {
    if (this.address) {
      await this.address.getCoordinates();
      this.coordinates = this.address.coordinates;
    } else if (this.city) {
      await this.city.getCoordinates();
      this.coordinates = this.city.coordinates;
    }

    return new ProcessedRow({
      id: this.id,
      partnerDatasetId: this.partnerDatasetId,
      raw: this.raw,
      parsedData: this.parsedData,
      coordinates: this.coordinates as Coordinates,
      city: this.city,
      address: this.address,
      logger: this.logger,
    });
  }

  private parse() {
    try {
      this.parsedData = this.raw;
      if (this.geodataType === "latLon") {
        this.coordinates = this.parseCoordinates();
      } else if (this.geodataType === "cityCountry") {
        this.city = this.parseCity();
      } else if (this.geodataType === "fullAddress") {
        this.address = this.parseAddress();
      }
    } catch (error: any) {
      this.parsedData[constants.csvHeaders.validationErrors] = error.message;
    }
  }

  private parseCoordinates() {
    const lat = this.parsedData["lat"];
    const lon = this.parsedData["lon"];

    if (lat && lon) {
      delete this.parsedData["lat"];
      delete this.parsedData["lon"];
      return new Coordinates({ longitude: lon, latitude: lat });
    }

    const latitude = this.parsedData["latitude"];
    const longitude = this.parsedData["longitude"];

    if (latitude && longitude) {
      delete this.parsedData["latitude"];
      delete this.parsedData["longitude"];
      return new Coordinates({ longitude, latitude });
    }
  }

  private parseCity() {
    const city = this.parsedData[csvPlaceColumns.city];
    const country = this.parsedData[csvPlaceColumns.country];
    if (city && country) {
      delete this.parsedData[csvPlaceColumns.city];
      delete this.parsedData[csvPlaceColumns.country];
      return new City({ city, country });
    }
  }

  private parseAddress() {
    const city = this.parsedData[csvPlaceColumns.city];
    const country = this.parsedData[csvPlaceColumns.country];
    const address = this.parsedData[csvPlaceColumns.address];
    if (address && country) {
      delete this.parsedData[csvPlaceColumns.address];
      delete this.parsedData[csvPlaceColumns.country];
      return new Address({ address, country, city: city || "" });
    }
  }

  export() {
    return this.toObject();
  }
}

export default ParsedRow;
