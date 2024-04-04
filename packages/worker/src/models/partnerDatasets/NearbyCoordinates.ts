import { NearbyCoordinatesGridResults } from "../../types";
import { constants } from "../../utils";

const exportConstants = constants.csvHeaders.nearbyCoordinates;

class NearbyCoordinates {
  coordinates: NearbyCoordinatesGridResults;

  constructor(raw: any, callParse: boolean) {
    this.coordinates = callParse ? this.parse(raw) : raw;
  }

  // Reads raw csv object and parses out nearby coordinate fields
  private parse(raw: any): NearbyCoordinatesGridResults {
    const RCM = {
      coordinate_hash: raw[exportConstants.RCM.hash],
      latitude: raw[exportConstants.RCM.lat],
      longitude: raw[exportConstants.RCM.lon],
    };
    const GCM = {
      coordinate_hash: raw[exportConstants.GCM.hash],
      latitude: raw[exportConstants.GCM.lat],
      longitude: raw[exportConstants.GCM.lon],
    };

    return { GCM, RCM };
  }

  validate() {
    const reasons = [];
    let valid = true;

    if (!this.coordinates) {
      reasons.push("No grid coordinates nearby");
      valid = false;
      return { valid: false, reasons };
    }

    if (!this.coordinates["GCM"]) {
      reasons.push("No GCM coordinates nearby");
      valid = false;
    }

    if (!this.coordinates["RCM"]) {
      reasons.push("No RCM coordinates nearby");
      valid = false;
    }

    return { valid, reasons };
  }

  export() {
    if (!this.coordinates) {
      return { [constants.csvHeaders.validationErrors]: "coordinate export error" };
    }

    let exportedCoordinates: any = {};

    const gcmResults = this.coordinates["GCM"];

    if (gcmResults) {
      exportedCoordinates[exportConstants.GCM.hash] = gcmResults.coordinate_hash;
      exportedCoordinates[exportConstants.GCM.lat] = gcmResults.latitude;
      exportedCoordinates[exportConstants.GCM.lon] = gcmResults.longitude;
    }

    const rcmResults = this.coordinates["RCM"];
    if (rcmResults) {
      exportedCoordinates[exportConstants.RCM.hash] = rcmResults.coordinate_hash;
      exportedCoordinates[exportConstants.RCM.lat] = rcmResults.latitude;
      exportedCoordinates[exportConstants.RCM.lon] = rcmResults.longitude;
    }

    return exportedCoordinates;
  }
}

export default NearbyCoordinates;
