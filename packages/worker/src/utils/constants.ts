import path from "path";

export const rdsRootCA = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "/data/amazon-rds-ca-bundle.pem",
);

export const csvHeaders = {
  required: ["lon", "lat"],
  rowId: "__pf_row_id",
  nearbyCoordinates: {
    RCM: {
      hash: "__pf_rcm_coordinate_hash",
      lat: "__pf_rcm_coordinate_lat",
      lon: "__pf_rcm_coordinate_lon",
    },
    GCM: {
      hash: "__pf_gcm_coordinate_hash",
      lat: "__pf_gcm_coordinate_lat",
      lon: "__pf_gcm_coordinate_lon",
    },
  },
  partnerDatasetId: "__pf_partner_dataset_id",
  validationErrors: "__pf_validation_errors",
};

export const csvPlaceColumns = {
  city: "city",
  country: "country",
  address: "address",
};

export const nearByCoordinatesBatchSize = 50000;
export const processingInsertBatchSize = 50000;
