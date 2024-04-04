import { gql } from "@apollo/client";

export const CREATE_PARTNER_DATASET_UPLOAD = gql`
  mutation ($s3Url: String!, $partnerDatasetId: UUID!, $geodataType: String!, $enrich: Boolean!) {
    createPartnerDatasetUpload(
      input: {
        fileUrl: $s3Url
        datasetId: $partnerDatasetId
        geodataType: $geodataType
        enrich: $enrich
      }
    ) {
      pfPartnerDatasetUpload {
        id
        processingErrors
        processingWithCoordinatesErrors
        processedWithCoordinatesFile
        processingTimeMs
        processedRowCount
        partnerDatasetId
        processedWithCoordinatesRowCount
        enrich
        status
      }
    }
  }
`;

export const CREATE_PARTNER_DATASET = gql`
  mutation ($name: String!, $description: String) {
    createPartnerDataset(input: { name: $name, description: $description }) {
      pfPartnerDataset {
        id
      }
    }
  }
`;

export const GET_PF_PARTNER_DATASETS = gql`
  query ($first: Int, $offset: Int, $filter: ViewPartnerDatasetFilter) {
    viewPartnerDatasets(first: $first, offset: $offset, orderBy: CREATED_AT_DESC, filter: $filter) {
      nodes {
        name
        id
        description
        createdAt
        updatedAt
        originalFile
        uploadId
        processedWithCoordinatesFile
        isExample
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
      }
      totalCount
    }
  }
`;

export const DELETE_PF_PARTNER_DATASET = gql`
  mutation ($id: UUID!) {
    deletePartnerDataset(input: { datasetId: $id }) {
      boolean
    }
  }
`;

export const DELETE_PF_PARTNER_PROJECT_DATASET = gql`
  mutation ($projectId: UUID!, $datasetId: UUID!) {
    deletePartnerProjectDataset(input: { projectId: $projectId, datasetId: $datasetId }) {
      boolean
    }
  }
`;

export const START_ENRICHMENT = gql`
  mutation ($pfDatasetId: Int!, $partnerDatasetId: UUID!, $uploadId: UUID!, $projectId: UUID!) {
    createPartnerDatasetEnrichment(
      input: {
        pfDatasetId: $pfDatasetId
        partnerDatasetId: $partnerDatasetId
        uploadId: $uploadId
        projectId: $projectId
      }
    ) {
      pfPartnerDatasetEnrichment {
        id
      }
    }
  }
`;

export const GET_DATASET_ENRICHMENT = gql`
  query DatasetEnrichement($id: UUID!) {
    viewPartnerDatasetEnrichment(id: $id) {
      id
      status
      enrichedDatasetFile
      enrichmentErrors
      enrichedRowCount
      projectId
      pfDatasetId
    }
  }
`;

export const GET_PARTNER_DATASET_UPLOAD = gql`
  query PartnerDatasetUpload($id: UUID!) {
    viewPartnerDatasetUpload(id: $id) {
      id
      processingErrors
      processingWithCoordinatesErrors
      processedWithCoordinatesFile
      processingTimeMs
      processedRowCount
      partnerDatasetId
      processedWithCoordinatesRowCount
      status
    }
  }
`;

export const GET_DATASET_SIGNED_URLS = gql`
  mutation ($fileUrls: [String]!, $type: String) {
    datasetSignedUrls(input: { fileUrls: $fileUrls, type: $type })
  }
`;

export const UPDATE_PARTNER_DATASET = gql`
  mutation ($datasetName: String!, $datasetId: UUID!) {
    updatePartnerDataset(input: { datasetName: $datasetName, datasetId: $datasetId }) {
      pfPartnerDataset {
        id
        name
      }
    }
  }
`;
