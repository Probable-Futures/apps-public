import { gql } from "@apollo/client";

export const GET_PF_USER_ACCESS_REQUESTS = gql`
  query PfUserAccessRequests(
    $first: Int!
    $offset: Int!
    $condition: ViewUserAccessRequestCondition
  ) {
    viewUserAccessRequests(first: $first, offset: $offset, condition: $condition) {
      nodes {
        id
        formName
        email
        formFields
        accessGranted
        rejected
        note
        finalEmail
        customEmail
        customEmailDiscarded
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
      }
      totalCount
    }
  }
`;

export const UPDATE_USER_ACCESS_REQUEST = gql`
  mutation (
    $id: UUID!
    $accessGranted: Boolean
    $rejected: Boolean
    $note: String
    $finalEmail: String
    $customEmail: String
    $customEmailDiscarded: Boolean
  ) {
    pfUpdateUserAccessRequest(
      input: {
        id: $id
        accessGranted: $accessGranted
        rejected: $rejected
        note: $note
        finalEmail: $finalEmail
        customEmail: $customEmail
        customEmailDiscarded: $customEmailDiscarded
      }
    ) {
      boolean
    }
  }
`;

export const SEND_CUSTOM_ONBOARDING_EMAIL = gql`
  mutation ($requestId: UUID!, $emailBody: String!) {
    sendCustomOnboardingEmail(input: { requestId: $requestId, emailBody: $emailBody }) {
      success
    }
  }
`;
