import { errors } from "../../utils";
import Coordinates from "./Coordinates";
import Place from "./Place";
import mbxGeocode from "../../services/geocode/geocode";

class Address extends Place {
  city?: string;
  address: string;
  coordinates?: Coordinates;
  requiredFields = ["address", "country"];
  optionalFields = ["city"];
  country: string;

  constructor({ address, country, city }: { address: string; country: string; city?: string }) {
    super();
    this.city = city;
    this.country = country;
    this.address = address;
  }

  validate() {
    super.validate();
    if (this.address.length === 0) {
      throw new errors.ValidationError({
        message: "Empty address field",
        invalidData: { address: this.address, country: this.country },
      });
    }
  }

  toObject() {
    return { city: this.city, country: this.country, address: this.address };
  }

  export() {
    const { city, country, address } = this.toObject();
    return { city, country, address };
  }

  async geocode(): Promise<{ latitude: string; longitude: string }> {
    const { lat, long, place_name } = await mbxGeocode({
      country: this.country,
      city: this.city,
      address: this.address,
    });
    return { latitude: lat.toString(), longitude: long.toString() };
  }
}
export default Address;
