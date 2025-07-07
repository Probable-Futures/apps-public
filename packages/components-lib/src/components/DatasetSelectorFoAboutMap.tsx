import { Option, Map, colors } from "@probable-futures/lib";
import { ExpandCollapseIcon } from "../styles";
import * as S from "../styles/datasetSelectorStyles";
import useDatasetSelctor from "../hooks/useDatasetSelector";
import styled from "styled-components";
import { MinusIcon, PlusIcon } from "./header/DatasetSelector";

type Props = {
  value: Option;
  datasets: Map[];
  translatedDatasets?: any;
  onChange?: (option: Option) => void;
};

const WrapperComponent = styled.div`
  width: 100%;
  border: 1px solid ${colors.grey};
  border-radius: 6px;
  background-color: ${colors.lightCream};
  user-select: none;
  overflow: auto;
`;

const DatasetSelectorForAboutMap = ({ value, datasets, translatedDatasets, onChange }: Props) => {
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
    <WrapperComponent>
      <S.MainTitle isOpen={selectMode} onClick={toggleAllSections}>
        <S.Title animate={animateAccordionTitle}>{value.label}</S.Title>
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

export default DatasetSelectorForAboutMap;
