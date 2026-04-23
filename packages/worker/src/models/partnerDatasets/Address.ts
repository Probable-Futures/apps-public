import { errors } from "../../utils";
import Coordinates from "./Coordinates";
import Place from "./Place";
import mbxGeocode from "../../services/geocode/geocode";

class Address extends Place {
  city?: string;
  state?: string;
  address: string;
  coordinates?: Coordinates;
  requiredFields = ["address", "country"];
  optionalFields = ["city", "state"];
  country?: string;

  constructor({
    address,
    country,
    city,
    state,
  }: {
    address: string;
    country?: string;
    city?: string;
    state?: string;
  }) {
    super();
    this.city = city;
    this.state = state;
    this.country = country;
    this.address = address;
  }

  validate() {
    super.validate();
    if (this.address.length === 0) {
      throw new errors.ValidationError({
        message: "Empty address field",
        invalidData: { address: this.address, state: this.state, country: this.country },
      });
    }
  }

  toObject() {
    return { city: this.city, state: this.state, country: this.country, address: this.address };
  }

  export() {
    const { city, state, country, address } = this.toObject();
    return { city, state, country, address };
  }

  async geocode(): Promise<{ latitude: string; longitude: string }> {
    const { lat, long, place_name } = await mbxGeocode({
      country: this.country,
      city: this.city,
      state: this.state,
      address: this.address,
    });
    return { latitude: lat.toString(), longitude: long.toString() };
  }
}
export default Address;
