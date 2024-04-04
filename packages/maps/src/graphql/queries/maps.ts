import { gql } from "@apollo/client";

export const PUBLISHED_MAPS_QUERY = gql`
  {
    pfMaps(orderBy: ORDER_ASC, condition: { status: "published" }) {
      nodes {
        mapStyleId
        name
        stops
        binHexColors
        isDiff
        step
        binLabels
        binningType
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

export default gql`
  {
    pfMaps(orderBy: DATASET_ID_ASC) {
      nodes {
        mapStyleId
        name
        stops
        binHexColors
        status
        isDiff
        step
        binLabels
        binningType
        slug
        mapVersion
        isLatest
        dataLabels
        methodUsedForMid
        dataset {
          id
          name
          model
          unit
          minValue
          maxValue
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
