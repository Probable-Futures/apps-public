import { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { colors, Option, TourProps, Map } from "@probable-futures/lib";
import * as S from "../../styles/datasetSelectorStyles";

import TourBox from "../TourBox";
import { generateGroupedDatasets } from "../../utils/dataset";

type Props = {
  value: Option;
  tourProps?: TourProps;
  datasets: Map[];
  translatedHeader?: any;
  selectMode: boolean;
  setSelectMode: React.Dispatch<React.SetStateAction<boolean>>;

  setShowAllMapsModal?: (show: boolean) => void;
  onChange?: (option: Option) => void;
};

const fadeInAnimation = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const AccordionWrapper = styled.div`
  width: 220px;
  border: 1px solid ${colors.grey};
  border-radius: 6px;
  background-color: ${colors.white};
  max-height: 80vh;
  overflow-y: scroll;
  user-select: none;
  color: ${colors.dimBlack};
`;

const AccordionTitle = styled.div<{ isCollapsed: boolean }>`
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  padding-bottom: ${({ isCollapsed }) => (isCollapsed ? "10px" : "0")};
  align-items: center;
  border-bottom: 1px solid;
  border-bottom-color: ${({ isCollapsed }) => (isCollapsed ? colors.grey : "transparent")};
  transition: border-bottom-color 0.3s ease-in-out, padding-bottom 0.3s ease-in-out;

  &:last-child {
    border-bottom: none;
  }
`;

const AccordionContent = styled.div<{ isVisible: boolean }>`
  max-height: ${({ isVisible }) => (isVisible ? "1000px" : "0")};
  overflow: hidden;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;

  &:last-child {
    padding-bottom: 0;
  }
`;

const MainTitle = styled.div`
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  padding: 10px;
  border-bottom: 1px solid ${colors.grey};
  font-size: 13px;
  align-items: center;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${colors.cream};
  }
`;

const ExpandCollapseIcon = styled.div<{ isOpen: boolean }>`
  width: 20px;
  height: 20px;
  background-color: black;
  border-radius: 50%; /* Makes it a circle */
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(${({ isOpen }) => (isOpen ? "180deg" : "0deg")}); /* Flip when open */
  transition: transform 0.3s ease;

  &::before {
    content: "";
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid white;
  }
`;

const Section = styled.div<{ isFirstChild: boolean }>`
  padding: 10px 10px;
  font-size: 13px;
  border-top: ${({ isFirstChild }) => (!isFirstChild ? `1px solid ${colors.grey}` : "none")};
`;

const AllContent = styled.div<{ isVisible: boolean }>`
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: ${({ isVisible }) => (isVisible ? "translateY(0)" : "translateY(-10px)")};
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  height: ${({ isVisible }) => (isVisible ? "auto" : "0")}; /* Collapses when hidden */
  overflow: hidden;
`;

const SelectedMapWrapper = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => isVisible && "padding: 16px 10px;"}
  font-size: 13px;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: ${({ isVisible }) => (isVisible ? "translateY(0)" : "translateY(-10px)")};
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  display: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  height: ${({ isVisible }) => (isVisible ? "auto" : "0")};
  overflow: hidden;
`;

const ViewAllMaps = styled.div`
  padding-bottom: 5px;
  text-decoration: underline;
  cursor: pointer;
`;

const Label = styled.div<{ isSelected: boolean }>`
  padding: 8px 10px;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 6px;
  margin-top: 5px;
  background-color: ${({ isSelected }) =>
    isSelected ? `${colors.lightPurple}!important` : "transparent"};

  &:hover {
    background-color: ${colors.lightPurpleWithOpacity};
  }
`;

const SvgIcon = styled.svg`
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 1;
`;

const Title = styled.span<{ animate: boolean }>`
  display: inline-block;
  opacity: ${({ animate }) => (animate ? 0 : 0.8)};
  animation: ${({ animate }) => (animate ? fadeInAnimation : "none")} 0.3s ease-out forwards;
`;

export const PlusIcon = () => (
  <SvgIcon viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </SvgIcon>
);

export const MinusIcon = () => (
  <SvgIcon viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12" />
  </SvgIcon>
);

const DatasetSelector = ({
  value,
  onChange,
  setShowAllMapsModal,
  tourProps,
  datasets,
  translatedHeader,
  selectMode,
  setSelectMode,
}: Props) => {
  const [openSection, setOpenSection] = useState<string>("");
  const [animateAccordionTitle, setAnimateAccordionTitle] = useState(false);

  const groupedDatasets = useMemo(() => {
    const translatedDatasets = translatedHeader?.datasets || {};
    return generateGroupedDatasets(datasets, translatedDatasets);
  }, [datasets, translatedHeader?.datasets]);

  const toggleSection = (newLabel: string) => {
    setOpenSection((label) => (label === newLabel ? "" : newLabel));
  };

  const toggleAllSections = () => {
    setSelectMode((prev) => !prev);
  };

  useEffect(() => {
    setAnimateAccordionTitle(true);
    const timeout = setTimeout(() => setAnimateAccordionTitle(false), 400);
    return () => clearTimeout(timeout);
  }, [selectMode]);

  const renderContent = () => {
    return (
      <AccordionWrapper>
        <MainTitle onClick={toggleAllSections}>
          <Title animate={animateAccordionTitle}>
            {translatedHeader?.selectMap || "Select a map"}
          </Title>
          <ExpandCollapseIcon isOpen={selectMode} />
        </MainTitle>

        <AllContent isVisible={selectMode}>
          {groupedDatasets.map((section, index) => (
            <Section key={section.label} isFirstChild={index === 0}>
              <AccordionTitle
                isCollapsed={openSection === section.label}
                onClick={() => toggleSection(section.label)}
              >
                <span>{section.label}</span>
                <S.SignButton>
                  {openSection === section.label ? <MinusIcon /> : <PlusIcon />}
                </S.SignButton>
              </AccordionTitle>
              <AccordionContent isVisible={openSection === section.label}>
                {section.options?.map((option) => (
                  <Label
                    key={option.value}
                    onClick={() => {
                      setSelectMode((s) => !s);
                      if (onChange) {
                        onChange(option);
                      }
                    }}
                    isSelected={value.value === option.value}
                  >
                    {option.label}
                  </Label>
                ))}
              </AccordionContent>
            </Section>
          ))}
          <Section isFirstChild={false}>
            <ViewAllMaps onClick={() => setShowAllMapsModal && setShowAllMapsModal(true)}>
              {translatedHeader?.viewAllMaps || "View all maps"}
            </ViewAllMaps>
          </Section>
        </AllContent>
        <SelectedMapWrapper isVisible={!selectMode}>{value.label}</SelectedMapWrapper>
      </AccordionWrapper>
    );
  };

  return tourProps !== undefined ? (
    <TourBox
      show={tourProps?.isTourActive && tourProps?.step === 0}
      {...tourProps}
      position="right"
    >
      {renderContent()}
    </TourBox>
  ) : (
    renderContent()
  );
};

export default DatasetSelector;
