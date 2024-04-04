import { gql } from "@apollo/client";

export const CREATE_PF_COUNTRY_STATISTICS = gql`
  mutation ($countryId: UUID!, $datasetId: Int!) {
    createPfCountryStatistics(input: { countryId: $countryId, datasetId: $datasetId }) {
      pfCountryStatistics {
        id
        countryId
        datasetId
        fileUrl
        status
      }
    }
  }
`;

export const COUNTRIES = gql`
  {
    countries(orderBy: NAME_ASC) {
      nodes {
        id
        isoA2
        isoA3
        name
      }
    }
  }
`;

export const VIEW_PF_COUNTRY_STATISTICS_BY_ID = gql`
  query PfCountryStatistics($id: UUID!) {
    viewPfCountryStatistics(condition: { id: $id }) {
      nodes {
        datasetId
        countryId
        fileUrl
        status
      }
    }
  }
`;

export const VIEW_PF_COUNTRY_STATISTICS_BY_COUNTRY_AND_DATASET = gql`
  query PfCountryStatistics($countryId: UUID!, $datasetId: Int!) {
    viewPfCountryStatistics(condition: { countryId: $countryId, datasetId: $datasetId }) {
      nodes {
        datasetId
        countryId
        fileUrl
        status
      }
    }
  }
`;
