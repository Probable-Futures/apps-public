import styled from "styled-components";

import { size, HEADER_HEIGHT, Theme } from "@probable-futures/lib";
import InfoIcon from "../../assets/icons/info.svg";
import { whiteFilter, purpleFilter } from "../../styles/commonStyles";
import { useTheme } from "../../contexts";

type InfoButtonProps = {
  isPopoverOpen: boolean;
  theme: Theme;
};

const InfoButton = styled.button`
  height: ${HEADER_HEIGHT};
  width: 65px;
  background-image: url(${InfoIcon});
  background-repeat: no-repeat;
  background-size: 20px 20px;
  background-position: center;
  background-color: transparent;
  border: none;
  outline: 0;
  cursor: pointer;
  padding: 0;
  ${({ theme }: InfoButtonProps) => theme === "dark" && whiteFilter}
  ${({ isPopoverOpen }: InfoButtonProps) => isPopoverOpen && purpleFilter}

  @media (min-width: ${size.laptop}) {
    height: 55px;
    width: 50px;

    &:hover {
      ${purpleFilter}
    }
  }

  @media (min-width: ${size.desktop}) {
    width: 65px;
  }
`;

const Info = ({
  onInfoClick,
  showDescriptionModal,
}: {
  onInfoClick: () => void;
  showDescriptionModal: boolean;
}) => {
  const { theme } = useTheme();
  return <InfoButton isPopoverOpen={showDescriptionModal} onClick={onInfoClick} theme={theme} />;
};

export default Info;
