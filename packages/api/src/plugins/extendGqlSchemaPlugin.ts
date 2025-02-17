import { makeExtendSchemaPlugin, gql } from "graphile-utils";

import { datasetSignedUrls, projectSharedData } from "../services/graphql/project";
import approveOpenDataAccess from "../services/auth/approveOpenDataAccess";
import sendCustomOnboardingEmail from "../services/auth/sendCustomOnboardingEmail";

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
      input ApproveOpenDataAccessInput {
        formName: String
        email: String
        formFields: JSON
      }
      type ApproveOpenDataAccessResponse {
        userId: String
        clientId: String
        error: String
        userAlreadyExists: Boolean
      }
      input SendCustomOnboardingEmailInput {
        emailBody: String!
        requestId: UUID!
      }
      type SendCustomOnboardingEmailResponse {
        success: Boolean
      }
      extend type Mutation {
        datasetSignedUrls(input: FileInput!): [String]!
        approveOpenDataAccess(input: ApproveOpenDataAccessInput!): ApproveOpenDataAccessResponse
        sendCustomOnboardingEmail(
          input: SendCustomOnboardingEmailInput!
        ): SendCustomOnboardingEmailResponse
      }
      extend type Query {
        projectSharedData(slugId: UUID!): ShareData!
      }
    `,
    resolvers: {
      Mutation: {
        datasetSignedUrls,
        approveOpenDataAccess,
        sendCustomOnboardingEmail,
      },
      Query: {
        projectSharedData,
      },
    },
  };
});
