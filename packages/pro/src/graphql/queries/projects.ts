import { gql } from "@apollo/client";

export const CREATE_PARTNER_PROJECT = gql`
  mutation ($name: String!, $description: String, $pfDatasetId: Int) {
    createPartnerProject(
      input: { name: $name, description: $description, pfDatasetId: $pfDatasetId }
    ) {
      pfPartnerProject {
        id
        name
        description
        pfDatasetId
        mapConfig
        imageUrl
      }
    }
  }
`;

export const DELETE_PF_PARTNER_PROJECT = gql`
  mutation ($id: UUID!) {
    deletePartnerProject(input: { projectId: $id }) {
      boolean
    }
  }
`;

export const GET_PF_PARTNER_PROJECTS = gql`
  query ($first: Int!, $offset: Int!) {
    viewPartnerProjects(first: $first, offset: $offset, orderBy: CREATED_AT_DESC) {
      nodes {
        id
        name
        description
        createdAt
        updatedAt
        pfDatasetId
        imageUrl
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
      }
      totalCount
    }
  }
`;

export const GET_PF_PARTNER_PROJECT_DATASETS = gql`
  query ($projectId: UUID!) {
    viewPartnerProjectDatasets(condition: { projectId: $projectId }) {
      nodes {
        uploadId
        projectName
        projectId
        projectDescription
        datasetId
        datasetName
        datasetDescription
        originalFile
        enrichedDatasetFile
        processedWithCoordinatesFile
        enrich
        pfDatasetId
        processedWithCoordinatesRowCount
        processingStatus
        enrichmentStatus
        enrichedDatasetId
        isExample
        enrichmentCreatedAt
        enrichmentUpdatedAt
      }
    }
  }
`;

export const CREATE_PF_PARTNER_PROJECT_DATASET = gql`
  mutation ($projectId: UUID!, $datasetId: UUID!) {
    associatePartnerProjectAndDataset(input: { projectId: $projectId, datasetId: $datasetId }) {
      pfPartnerProjectDataset {
        datasetId
        projectId
      }
    }
  }
`;

export const UPDATE_PARTNER_PROJECT = gql`
  mutation (
    $projectId: UUID!
    $mapConfig: JSON
    $imageUrl: String
    $pfDatasetId: Int
    $projectName: String
  ) {
    updatePartnerProject(
      input: {
        projectId: $projectId
        mapConfig: $mapConfig
        imageUrl: $imageUrl
        pfDatasetId: $pfDatasetId
        projectName: $projectName
      }
    ) {
      pfPartnerProject {
        id
        name
        mapConfig
        imageUrl
        pfDatasetId
      }
    }
  }
`;

export const GET_PARTNER_PROJECT = gql`
  query PartnerProject($id: UUID!) {
    viewPartnerProject(id: $id) {
      id
      name
      description
      mapConfig
      pfDatasetId
      imageUrl
    }
  }
`;

export const CREATE_PARTNER_PROJECT_SHARE = gql`
  mutation ($projectId: UUID!) {
    createPartnerProjectShare(input: { projectId: $projectId }) {
      pfPartnerProjectShare {
        id
      }
    }
  }
`;

export const GET_PARTNER_PROJECT_SHARE = gql`
  query ($slugId: UUID!) {
    projectSharedData(slugId: $slugId) {
      mapConfig
      files {
        name
        url
      }
      pfDatasetId
    }
  }
`;
