import { makeExtendSchemaPlugin, gql } from "graphile-utils";

import { datasetSignedUrls, projectSharedData } from "../services/graphql/project";
import acceptInvitation from "../services/auth/acceptInvitation";

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
      type AcceptInvitationResponse {
        userId: String
        clientId: String
        error: String
      }
      input AcceptInvitationInput {
        requestId: UUID!
        note: String
      }
      extend type Mutation {
        datasetSignedUrls(input: FileInput!): [String]!
        acceptInvitation(input: AcceptInvitationInput!): AcceptInvitationResponse
      }
      extend type Query {
        projectSharedData(slugId: UUID!): ShareData!
      }
    `,
    resolvers: {
      Mutation: {
        datasetSignedUrls,
        acceptInvitation,
      },
      Query: {
        projectSharedData,
      },
    },
  };
});
