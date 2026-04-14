import { useAuth0 } from "@auth0/auth0-react";
import styled from "styled-components";

import { colors } from "../../consts";
import { ReactComponent as LogoutIcon } from "../../assets/icons/logout.svg";

const Container = styled.div`
  border-top: 1px solid ${colors.lightGrey};
  padding: 12px 16px 11px 19px;
  display: flex;
  justify-content: space-between;
`;

const Name = styled.span`
  color: ${colors.darkPurple};
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px;
`;

const LogoutButton = styled.button`
  width: 20px;
  height: 20px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
  }
`;

export default function UserInfo(): JSX.Element {
  const { user, logout } = useAuth0();

  if (!user) {
    throw Error("No user from Auth0");
  }

  return (
    <Container>
      <Name>{user.name}</Name>
      <LogoutButton title="Logout" onClick={() => logout({ returnTo: window.location.origin })}>
        <LogoutIcon />
      </LogoutButton>
    </Container>
  );
}
