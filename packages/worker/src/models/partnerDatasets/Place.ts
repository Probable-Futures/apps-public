import { errors } from "../../utils";
import Coordinates from "./Coordinates";

abstract class Place {
  coordinates?: Coordinates;
  abstract requiredFields: string[];
  abstract country: string;

  validate(): void {
    if (this.country.length === 0) {
      throw new errors.ValidationError({
        message: "Empty country field",
        invalidData: { country: this.country },
      });
    }
  }

  async getCoordinates() {
    this.validate();
    const geocodeResults = await this.geocode();
    this.coordinates = new Coordinates(geocodeResults);
  }

  abstract toObject(): any;

  abstract export(): any;

  abstract geocode(): Promise<{ latitude: string; longitude: string }>;
}

export default Place;
