import React from "react";
import Grid from "@mui/material/Grid";
import styled from "styled-components";

import DashboardTitle from "../../Common/DashboardTitle";
import List from "./List";
import DocImg from "../../../assets/images/documentation.png";
import { colors } from "../../../consts";

const DocImgContainer = styled.div`
  display: flex;
  padding: 10px;
  box-sizing: border-box;
  border: 1px solid #bebfbb;
  border-radius: 12px;
`;

const Container = styled.div`
  font-size: 16px;
  font-family: LinearSans;
  color: ${colors.darkPurple};
  p {
    font-size: 16px;
    letter-spacing: 0;
    line-height: 23px;
  }
`;

const Documentation = (): JSX.Element => {
  return (
    <Container>
      <DashboardTitle title="Documentation" />
      <Grid container spacing={10}>
        <Grid item xs={12} md={7}>
          <p>
            Probable Futures Pro is an online tool that enables anyone to make customized maps of
            the things they care about in a warming world. With it, you can explore and illustrate
            potential impacts of climate change to communities, institutions, cultures, and
            industries around the world.
          </p>
          <DocImgContainer>
            <img src={DocImg} width="100%" alt="pf-professional-map-view" />
          </DocImgContainer>
          <p>
            ProbableFutures.org offers interactive maps, science, historical context, and stories to
            help us all envision a range of climate futures.
          </p>
          <p>
            Probable Futures Pro offers the next step: How will these climate futures interact with
            the people, places, or things that matter to me?
          </p>
        </Grid>
        <Grid item xs={12} md={5}>
          <p>
            Before using Pro, please read through the{" "}
            <a href="https://probablefutures.org/" target="_blank" rel="noopener noreferrer">
              Probable Futures
            </a>{" "}
            public website and explore{" "}
            <a href="https://probablefutures.org/maps" target="_blank" rel="noopener noreferrer">
              the maps
            </a>
            . Probable Futures Pro builds upon the scientific and educational framework created for
            the public website. Exploring the public website provides essential context for using
            Probable Futures Pro.
          </p>
          <List />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Documentation;
