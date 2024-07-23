import { gql } from "@apollo/client";

export const CREATE_PF_GEO_PLACE_STATISTICS = gql`
  mutation ($geoPlaceId: UUID!, $datasetId: Int!) {
    createPfGeoPlaceStatistics(input: { geoPlaceId: $geoPlaceId, datasetId: $datasetId }) {
      pfGeoPlaceStatistics {
        id
        geoPlaceId
        datasetId
        fileUrl
        status
      }
    }
  }
`;

export const GEO_PLACES = gql`
  {
    geoPlaces(orderBy: NAME_ASC) {
      nodes {
        id
        isoA2
        isoA3
        name
        geoPlaceType
      }
    }
  }
`;

export const VIEW_PF_GEO_PLACE_STATISTICS_BY_ID = gql`
  query PfGeoPlaceStatistics($id: UUID!) {
    viewPfGeoPlaceStatistics(condition: { id: $id }) {
      nodes {
        datasetId
        geoPlaceId
        fileUrl
        status
      }
    }
  }
`;

export const VIEW_PF_GEO_PLACE_STATISTICS_BY_GEO_PLACE_AND_DATASET = gql`
  query PfGeoPlaceStatistics($geoPlaceId: UUID!, $datasetId: Int!) {
    viewPfGeoPlaceStatistics(condition: { geoPlaceId: $geoPlaceId, datasetId: $datasetId }) {
      nodes {
        datasetId
        geoPlaceId
        fileUrl
        status
      }
    }
  }
`;
