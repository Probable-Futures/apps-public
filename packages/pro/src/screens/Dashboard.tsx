import styled from "styled-components";
import { Outlet } from "react-router-dom";
import { useCallback, useState } from "react";

import Loader from "@probable-futures/components-lib/src/components/Loader";
import Header from "../components/Dashboard/Header/Header";
import { colors } from "../consts";

const Container = styled.div`
  background-color: ${colors.cream};
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
`;

const Content = styled.div`
  max-width: 75%;
  margin: 0 auto;
`;

const RouteWrapper = styled.div`
  margin-top: 20px;
`;

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);

  const toggleLoading = useCallback((loading: boolean) => setIsLoading(loading), []);

  return (
    <Container>
      <Loader show={isLoading} />
      <Content>
        <Header />
        <RouteWrapper>
          <Outlet
            context={{
              isLoading,
              toggleLoading,
            }}
          />
        </RouteWrapper>
      </Content>
    </Container>
  );
};

export default Dashboard;
