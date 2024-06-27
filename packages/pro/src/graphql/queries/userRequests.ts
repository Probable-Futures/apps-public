import { gql } from "@apollo/client";

export const GET_PF_USER_ACCESS_REQUESTS = gql`
  query PfUserAccessRequests {
    viewUserAccessRequests {
      nodes {
        id
        formName
        email
        formFields
        accessGranted
        rejected
        note
      }
    }
  }
`;

export const UPDATE_USER_ACCESS_REQUEST = gql`
  mutation ($id: UUID!, $accessGranted: Boolean!, $rejected: Boolean!, $note: String!) {
    pfUpdateUserAccessRequest(
      input: { id: $id, accessGranted: $accessGranted, rejected: $rejected, note: $note }
    ) {
      boolean
    }
  }
`;

export const APPROVE_USER_ACCESS_REQUEST = gql`
  mutation ($requestId: UUID!, $note: String) {
    acceptInvitation(input: { requestId: $requestId, note: $note }) {
      userId
      clientId
    }
  }
`;
