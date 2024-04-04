import { createGlobalStyle } from "styled-components";
import { normalize } from "styled-normalize";

import { colors } from "./consts";

export default createGlobalStyle`
${normalize}

body {
  margin: 0;
  overflow: hidden;
  font-family: LinearSans, Arial, Helvetica, sans-serif;
  font-size: 16px;
  color: ${colors.darkPurple};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: ${colors.dimBlack};

  &:hover {
    color: ${colors.purple};
  }
}
`;
