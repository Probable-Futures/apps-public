import { Geodata } from "../types";

export interface EnrichPartnerDatasetPayload {
  id: string;
  partnerId: string;
  uploadId: string;
  pfDatasetId: number;
  partnerDatasetId: string;
}

export interface ProcessParterDatasetPayload {
  id: string;
  partnerId: string;
  originalFile: string;
  partnerDatasetId: string;
  geodataType: Geodata;
}

export interface AddNearbyPFCoordinatesToPartnerDatasetPayload {
  partnerId: string;
  uploadId: string;
  partnerDatasetId: string;
  processedFileLocation: string;
}

export interface DeletePartnerDatasetPayload {
  id: string;
  partnerId: string;
  files: string[];
}

export interface CreateStatisticsFilePayload {
  id: string;
  datasetId: number;
  countryId: string;
}
