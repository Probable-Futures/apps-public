import { EnrichStatus } from "../utils/useEnrichmentProcess";

type PfPartnerDatasetEnrichment = {
  id: string;
  status: string;
  enrichedDatasetFile: string;
};

type PfPartnerDatasetUpload = {
  id: string;
  originalFile: string;
};

export type Dataset = {
  id: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
  pfPartnerDatasetEnrichmentsByPartnerDatasetId: { nodes: PfPartnerDatasetEnrichment[] };
  pfPartnerDatasetUploadsByPartnerDatasetId: { nodes: PfPartnerDatasetUpload[] };
};

export type PageInfo = {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PaginationType = {
  totalCount: number;
  pageInfo: PageInfo;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
  pfDatasetId?: number;
  imageUrl?: string;
};

export interface PfDataset {
  id: string;
  name: string;
}

export type Option = {
  value: string | number;
  label: string;
};

export type DatasetFields = {
  analyzerType: string;
  displayName: string;
  fieldIdx: number;
  format: string;
  id: string;
  label: string;
  name: string;
  type: string;
  value: any;
  valueAccessor: () => void;
};

export type GqlResponse<T> = {
  nodes: T[];
};

type RowMap<V = any> = Record<string, V>;
type RowArray<V = any> = V[];
type Row<V = any> = RowMap<V> | RowArray<V>;

type RawCsvRow = Row<string> | { [key: string]: string };
export type InvalidRow<T> = { row: T; reason?: string; rowNumber: number };

interface Coordinates {
  requiredFields: {
    short: ["long", "lat"];
  };
  raw: {
    latitude: string;
    longitude: string;
  };
  latitude: number;
  longitude: number;
}

interface City {
  city: string;
  country: string;
  coordinates?: Coordinates;
  requiredFields: ["city", "country"];
}

interface CsvRow {
  raw: RawCsvRow;
}

export interface ProcessedRow extends CsvRow {
  id: string;
  partnerDatasetId: string;
  coordinates: Coordinates;
  city?: City;
  parsedData: any;
  raw: RawCsvRow;
}

export type ProcessingErrors = {
  errors: any[];
  invalid_rows: InvalidRow<ProcessedRow>[];
};
export type ProcessingWithCoordinatesErrors = {
  errors: string[];
};
export type ErichmentErrors = string[];

export type UploadProcessErrorsUI = {
  message: string;
  logErrors?: any;
  descriptiveErrors?: InvalidRow<ProcessedRow>[];
};

export type ProjectDatasetNode = {
  uploadId: string;
  projectName: string;
  projectId: string;
  projectDescription: string;
  datasetId: string;
  datasetName: string;
  datasetDescription: string;
  originalFile: string;
  enrichedDatasetFile?: string;
  processedWithCoordinatesFile: string;
  enrich: boolean;
  pfDatasetId: number;
  processedWithCoordinatesRowCount: number;
  processingStatus: EnrichStatus;
  enrichmentStatus: EnrichStatus;
  enrichedDatasetId?: string;
  isExample: boolean;
  enrichmentCreatedAt: Date;
  enrichmentUpdatedAt: Date;
};

export type PfPartnerProjectDatasets = {
  viewPartnerProjectDatasets: GqlResponse<ProjectDatasetNode>;
};
