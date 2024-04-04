import { gql } from "@apollo/client";

export const AUTHENTICATE = gql`
  mutation ($email: String!, $name: String) {
    authenticatePfUser(input: { name: $name, email: $email }) {
      pfUser {
        sub
        name
        email
      }
    }
  }
`;
