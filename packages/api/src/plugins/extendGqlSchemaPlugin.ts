import { makeExtendSchemaPlugin, gql } from "graphile-utils";

import { datasetSignedUrls, projectSharedData } from "../services/graphql/project";

export const ExtendGqlSchemaPlugin = makeExtendSchemaPlugin((build) => {
  return {
    typeDefs: gql`
      input FileInput {
        fileUrls: [String]!
        type: String
      }
      extend input GetDatasetStatisticsInput {
        country: String
        city: String
        address: String
      }
      extend type DatasetStatisticsResponse {
        info: JSON
      }
      type File {
        name: String
        url: String
      }
      type ShareData {
        mapConfig: JSON
        files: [File]
        pfDatasetId: Int
      }
      extend type Mutation {
        datasetSignedUrls(input: FileInput!): [String]!
      }
      extend type Query {
        projectSharedData(slugId: UUID!): ShareData!
      }
    `,
    resolvers: {
      Mutation: {
        datasetSignedUrls,
      },
      Query: {
        projectSharedData,
      },
    },
  };
});
