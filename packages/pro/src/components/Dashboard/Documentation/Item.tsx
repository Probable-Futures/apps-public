import React from "react";
import styled from "styled-components";

import { colors } from "../../../consts";

type Props = {
  title: string;
  description: string;
  link: string;
};

const StyledTitle = styled.a`
  color: ${colors.secondaryBlack};
  font-size: 24px;
  letter-spacing: 0;
  margin-top: 12px;
  cursor: pointer;
  border-bottom: 1px solid;
  line-height: 28px;
  display: inline-block;
  font-family: Cambon;
  text-decoration: none;
  outline: 0;
`;

const Item = ({ title, description, link }: Props): JSX.Element => {
  return (
    <div>
      <StyledTitle href={link} target="_blank" rel="noopener noreferrer">
        {title}
      </StyledTitle>
      <p dangerouslySetInnerHTML={{ __html: description }} />
    </div>
  );
};

export default Item;
