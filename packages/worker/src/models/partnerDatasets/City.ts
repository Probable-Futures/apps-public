import { errors } from "../../utils";
import Coordinates from "./Coordinates";
import Place from "./Place";
import mbxGeocode from "../../services/geocode/geocode";

class City extends Place {
  city: string;
  country: string;
  coordinates?: Coordinates;
  requiredFields = ["city", "country"];

  constructor({ city, country }: { city: string; country: string }) {
    super();
    this.city = city;
    this.country = country;
  }

  validate() {
    super.validate();
    if (this.city.length === 0) {
      throw new errors.ValidationError({
        message: "Empty city field",
        invalidData: { city: this.city, country: this.country },
      });
    }
  }

  toObject() {
    return { city: this.city, country: this.country };
  }

  export() {
    const { city, country } = this.toObject();
    return { city, country };
  }

  async geocode(): Promise<{ latitude: string; longitude: string }> {
    const { lat, long, place_name } = await mbxGeocode({ country: this.country, city: this.city });
    return { latitude: lat.toString(), longitude: long.toString() };
  }
}
export default City;
