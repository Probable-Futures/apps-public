import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import LogoIcon from "../../../assets/icons/logo-black.svg";
import TabTitle from "../../Common/TabTitle";
import { routes } from "../../../consts/dashboardConsts";
import { isAdmin } from "../../../utils/user";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  flex-direction: row;
  height: 100px;
  margin-top: 10px;
`;

const StyledList = styled.ul`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const StyledLogo = styled.i`
  margin-right: 5px;
  height: 50px;
  width: 136px;
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center;
`;

const Tabs: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth0();

  const filteredRoutes = useMemo(() => {
    const userIsAdmin = isAdmin(user);
    return routes.filter((route) => (!route.adminOnly ? true : userIsAdmin));
  }, [user]);

  const onClick = useCallback(
    (index: number) => {
      const route = filteredRoutes[index];
      if (route.component) {
        navigate(route.path);
      } else if (route.title === "Log out") {
        logout({ returnTo: window.location.origin });
      }
    },
    [filteredRoutes, navigate, logout],
  );

  return (
    <Container>
      <StyledLogo icon={LogoIcon} />
      <StyledList>
        {filteredRoutes.map((item, index) => (
          <TabTitle
            key={index}
            title={item.title}
            index={index}
            onTabClick={onClick}
            isHeader
            isSelected={
              window.location.pathname.split("/")[
                window.location.pathname.split("/").length - 1
              ] === item.path
            }
          />
        ))}
      </StyledList>
    </Container>
  );
};

export default Tabs;
