import { Option, Map, colors, size } from "@probable-futures/lib";
import { ExpandCollapseIcon } from "../styles";
import * as S from "../styles/datasetSelectorStyles";
import useDatasetSelctor from "../hooks/useDatasetSelector";
import styled from "styled-components";

type Props = {
  value: Option;
  datasets: Map[];
  translatedDatasets?: any;
  onChange?: (option: Option) => void;
};

const PlusIcon = () => (
  <S.SvgIcon viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </S.SvgIcon>
);

const MinusIcon = () => (
  <S.SvgIcon viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12" />
  </S.SvgIcon>
);

const WrapperComponent = styled.div<{ isOpen: boolean }>`
  width: 100%;
  border: 1px solid ${colors.grey};
  background-color: ${colors.white};
  max-height: 100vh;
  overflow-y: scroll;
  user-select: none;
  ${({ isOpen }) => (isOpen ? "height: 100vh" : "height: auto")};

  @media (min-width: ${size.mobileMax}) {
    height: auto;
  }
`;

const StyledTitle = styled(S.Title)`
  font-size: 16px;
  font-weight: 400;
  line-height: 22px;
`;

const SelectMapText = styled.span`
  color: ${colors.dimBlack};
  opacity: 0.8;
  font-family: Linear Sans;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  top: 8px;
  left: 15px;
  position: absolute;
`;

const DatasetSelectorForMobile = ({ value, datasets, translatedDatasets, onChange }: Props) => {
  const {
    selectMode,
    groupedDatasets,
    animateAccordionTitle,
    openSections,
    isAllExpanded,
    expandAll,
    collapseAll,
    toggleAllSections,
    toggleSection,
    setSelectMode,
  } = useDatasetSelctor({ datasets, translatedDatasets });

  return (
    <WrapperComponent isOpen={selectMode}>
      <SelectMapText>Select a map</SelectMapText>
      <S.MainTitle isOpen={selectMode} onClick={toggleAllSections} style={{ marginTop: "2px" }}>
        <StyledTitle animate={animateAccordionTitle}>{value.label}</StyledTitle>
        <ExpandCollapseIcon isOpen={selectMode} />
      </S.MainTitle>

      <S.AllContent isVisible={selectMode}>
        {groupedDatasets.map((section, index) => (
          <S.Section key={section.label} isFirstChild={index === 0}>
            <S.AccordionTitle
              isCollapsed={openSections.includes(section.label)}
              onClick={() => toggleSection(section.label)}
            >
              <span>{section.label}</span>
              <S.SignButton>
                {openSections.includes(section.label) ? <MinusIcon /> : <PlusIcon />}
              </S.SignButton>
            </S.AccordionTitle>
            <S.AccordionContent isVisible={openSections.includes(section.label)}>
              {section.options?.map((option) => (
                <S.Label
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
                </S.Label>
              ))}
            </S.AccordionContent>
          </S.Section>
        ))}
        <S.Section isFirstChild={false}>
          <S.ViewAllMaps
            onClick={() => {
              isAllExpanded ? collapseAll() : expandAll();
            }}
          >
            {isAllExpanded ? "Collapse all" : "Expand all"}
          </S.ViewAllMaps>
        </S.Section>
      </S.AllContent>
    </WrapperComponent>
  );
};

export default DatasetSelectorForMobile;
