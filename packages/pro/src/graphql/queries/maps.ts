import { gql } from "@apollo/client";

export const PUBLISHED_MAPS_QUERY = gql`
  {
    pfMaps(orderBy: ORDER_ASC, condition: { status: "published", isLatest: true }) {
      nodes {
        mapStyleId
        name
        stops
        binHexColors
        isDiff
        step
        binLabels
        binningType
        createdAt
        updatedAt
        slug
        mapVersion
        isLatest
        dataLabels
        methodUsedForMid
        dataset {
          id
          name
          unit
          minValue
          maxValue
          slug
          dataVariables
          pfDatasetUnitByUnit {
            unitLong
          }
          pfDatasetParentCategoryByParentCategory {
            name
            label
          }
          subCategory
        }
      }
    }
  }
`;

export const CREATE_PARTNER_DATASET = gql`
  mutation ($name: String!, $description: String) {
    createPfPartnerDataset(
      input: { pfPartnerDataset: { name: $name, description: $description } }
    ) {
      pfPartnerDataset {
        id
      }
    }
  }
`;
