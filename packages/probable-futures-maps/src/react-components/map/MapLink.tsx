import styled from "styled-components";

import { Map } from "@probable-futures/lib";

type LinkProps = {
  bottom?: string;
};

const Link = styled.a`
  position: absolute;
  left: 0;
  padding: 0 5px;
  background-color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-family: Helvetica Neue, Arial, Helvetica, sans-serif;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.75);
  z-index: 3;
  transition: z-index 0.2s step-end;

  cursor: pointer;
  text-decoration: none;
  bottom: ${({ bottom }: LinkProps) => bottom ?? 0};
`;

const MapLink = ({ dataset }: { dataset?: Map }) => {
  if (!dataset) {
    return null;
  }
  return <Link>{`Probable Futures map v${dataset.mapVersion}`}</Link>;
};

export default MapLink;
