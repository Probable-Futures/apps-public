import { size } from "@probable-futures/lib";
import styled from "styled-components";

export type Source = "maps" | "pro";

export const Title = styled.h3`
  font-size: 12px;
  font-weight: 400;
  text-transform: uppercase;
  margin: 0;
  font-family: "RelativeMono";
  margin-bottom: 20px;

  @media (min-width: ${size.tablet}) {
    margin-bottom: 25px;
  }
`;
