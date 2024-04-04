import { RawCsvRow, Logger } from "../../../types";

abstract class Row {
  abstract logger: Logger;
  abstract raw: RawCsvRow;

  toObject() {
    return Object.assign({}, this);
  }

  toArray() {
    return Object.entries(this.toObject());
  }

  print(message?: string) {
    this.logger.info("%o", { message, ...this.toObject() } as any);
  }
}

export default Row;
