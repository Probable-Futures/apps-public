import { errors } from "../../utils";
import { WKTCoordinates } from "../../types";

class Coordinates {
  static requiredFields = {
    short: ["lon", "lat"],
  };

  raw: {
    latitude: string;
    longitude: string;
  };

  latitude: number;
  longitude: number;

  constructor(coords: { latitude: string; longitude: string }) {
    this.raw = coords;
    const coordinates = this.parse(coords);
    this.longitude = coordinates.longitude;
    this.latitude = coordinates.latitude;
  }

  validate() {
    const validLongitude = this.validLongitude();
    const validLatitude = this.validLatitude();
    const valid = validLatitude && validLongitude;

    if (valid) {
      return true;
    }

    if (!validLatitude && !validLongitude) {
      throw new errors.ValidationError({
        message: `Latitude & longitude out of bounds.`,
        invalidData: {
          raw: this.raw,
          parsed: { longitude: this.longitude, latitude: this.latitude },
        },
      });
    }

    if (!validLongitude) {
      throw new errors.ValidationError({
        message: `Longitude out of bounds.`,
        invalidData: {
          raw: this.raw.longitude,
          parsed: this.longitude,
        },
      });
    }

    if (!validLatitude) {
      throw new errors.ValidationError({
        message: `Latitude out of bounds.`,
        invalidData: {
          raw: this.raw.latitude,
          parsed: this.latitude,
        },
      });
    }
  }

  toWKT(): WKTCoordinates {
    return `POINT(${this.longitude} ${this.latitude})`;
  }

  toObject() {
    return { lon: this.longitude, lat: this.latitude };
  }

  export() {
    return this.toObject();
  }

  private parse(coords: { latitude: string; longitude: string }) {
    return {
      latitude: parseFloat(coords.latitude),
      longitude: parseFloat(coords.longitude),
    };
  }

  private validLongitude() {
    if (!this.longitude || this.longitude < -180 || this.longitude > 180) {
      return false;
    }
    return true;
  }

  private validLatitude() {
    if (!this.latitude || this.latitude < -90 || this.latitude > 90) {
      return false;
    }
    return true;
  }
}

export default Coordinates;
