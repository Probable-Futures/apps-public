import { useCallback, useMemo } from "react";
import styled from "styled-components";
// @ts-ignore
import { SidePanelSection, Button, FilterManagerFactory } from "kepler.gl/components";
import { styles } from "@probable-futures/components-lib";
import SearchIcon from "@probable-futures/components-lib/src/assets/icons/search.svg";
import { MAP_VERSION_URL } from "@probable-futures/lib/src/consts";
import { BinningType } from "@probable-futures/lib/src/utils";

import TrashIcon from "../../../assets/icons/map/trash.svg";
import DatasetTitle from "../Common/DatasetTitle";
import { colors } from "../../../consts";
import ThresholdFilter from "../Filter/ThresholdFilter";
import { useMapData } from "../../../contexts/DataContext";
import { PfProLogo } from "../../Common";
import { Filter, Datasets, KeplerTable } from "../../../types/reducers/vis-state-updaters";
import { Layer } from "../../../types/layers";
import { getFilterName } from "../../../utils/useDatasetFilter";
import { useAppSelector } from "../../../app/hooks";
import useEnrich from "../../../utils/useEnrich";
import ConfirmationModal from "../../Common/ConfirmationModal";
import DatasetLoader from "../Common/DatasetLoader";
import { DATA_VALUES, DEGREES } from "../../../consts/MapConsts";

type Props = {
  filters: Filter[];
  datasets: Datasets;
  layers: Layer[];
  visStateActions: any;
};

const StyledFilterManagerContainer = styled.div`
  .side-panel-section-hidden {
    display: none;
    opacity: 0;
    height: 0px;
  }

  .side-panel-section {
    display: block;
  }

  .side-panel-divider {
    display: none;
  }

  .filter-panel__header {
    background-color: ${colors.darkPurpleBackground};
    border-left: none;
    height: 60px;
  }

  .typeahead {
    border: 1px solid ${colors.darkGrey};
    background-color: #130e13;
    margin-top: -4px;
  }

  .typeahead__input_box {
    background-color: transparent;
    border: none;
    padding: 0px;
    margin: 8px;
  }

  .typeahead__input,
  .chickleted-input,
  .item-selector__dropdown {
    border: 1px solid ${colors.darkGrey};
    background-color: ${colors.secondaryBlack};
    border-radius: 0px;
    font-family: LinearSans;
    font-size: 14px !important;
    min-height: 36px;
    color: ${colors.primaryWhite};

    .item-selector__dropdown__value {
      color: ${colors.primaryWhite};
      font-family: LinearSans;
      font-size: 14px !important;
    }

    &.active {
      border: 1px solid ${colors.primaryWhite} !important;
    }

    ::placeholder {
      color: ${colors.primaryWhite};
      opacity: 1; /* Firefox */
    }

    span {
      font-size: 12px;
    }
  }

  .chickleted-input {
    div {
      background-color: #787279;
      color: ${colors.primaryWhite};
    }

    .chickleted-input__placeholder {
      visibility: hidden;

      &:after {
        color: ${colors.primaryWhite};
        font-size: 14px;
        font-family: LinearSans;
        visibility: visible;
        position: absolute;
        top: 7px;
        left: 12px;
        content: "Select a field";
        text-transform: initial;
      }
    }
  }

  .list-selector {
    color: ${colors.primaryWhite};
    background-color: #130e13;
    border-top: none;

    ::-webkit-scrollbar-track {
      background: ${colors.secondaryBlack};
    }

    ::-webkit-scrollbar-thumb {
      border: 1px solid ${colors.primaryWhite};
      background-color: #d8d8d8;
    }

    ::-webkit-scrollbar {
      width: 2px;
      height: 2px;
    }
  }

  .field-selector {
    max-width: 92%;
  }

  .field-selector_list-item {
    display: flex;
    flex: 1;
    justify-content: flex-end;
    flex-direction: row-reverse;
    color: ${colors.primaryWhite};
    align-items: center;
    font-family: LinearSans;
    font-size: 12px;

    div:first-child {
      border: none;

      div:first-child {
        border: none;
        background: transparent;
        color: ${colors.primaryWhite};

        ::before {
          content: "(";
        }

        ::after {
          content: ")";
        }
      }
    }
  }

  .list__item__anchor {
    color: ${colors.primaryWhite};
    font-family: LinearSans;
    font-size: 14px;
  }

  .filter-panel__content {
    background-color: ${colors.darkPurpleBackground};
    padding: 0px;
  }

  .filter-panel__filter {
    padding: 0px 12px 12px 12px;

    .side-panel-panel__label {
      visibility: hidden;
      position: relative;
    }

    .side-panel-panel__label:after {
      color: ${colors.midGrey};
      font-size: 14px;
      font-family: LinearSans;
      visibility: visible;
      position: absolute;
      top: 0;
      left: 0;
      content: "Selection(s)";
      text-transform: initial;
    }
  }

  .add-filter-button {
    color: ${colors.primaryWhite};
    font-family: LinearSans;
    font-size: 14px;
    letter-spacing: 0;
    text-align: center;
    background: transparent;
    border: 1px solid white;
    cursor: pointer;

    .data-ex-icons-add {
      display: none;
    }

    &:hover {
      border: 1px solid ${colors.secondaryBlue};
      color: ${colors.secondaryBlue};
    }
  }

  .data-ex-icons-trash {
    display: none;
  }

  .panel--header__action:hover {
    &:after {
      ${styles.blueFilter}
      pointer-events: none;
    }
  }

  .data-ex-icons-search {
    visibility: hidden;
    position: relative;
  }

  .typeahead__input_icon:after {
    visibility: visible;
    display: inline-block;
    content: " ";
    background-image: url(${SearchIcon});
    background-repeat: no-repeat;
    background-size: 100% auto;
    background-position: center;
    margin-right: 5px;
    height: 14.98px;
    width: 15px;
    cursor: pointer;
    margin-top: 3px;
    ${styles.whiteFilter}

    :hover {
      opacity: 0.7;
    }
  }

  .filter-panel {
    border-bottom: 1px solid #424242;
    border-radius: inherit;
    margin-bottom: 0px;

    :first-child {
      border-top: 1px solid #424242;
    }
    position: relative;
  }

  .data-source-selector {
    display: none;
  }

  .histogram-bars rect {
    fill: ${colors.darkGrey};

    &.in-range {
      fill: ${colors.blue};
    }
  }

  .kg-range-slider {
    &__bar {
      background-color: ${colors.blue} !important;
      height: 2px !important;
    }

    &__handle {
      border-radius: 50% !important;
      width: 16px !important;
      height: 16px !important;
      margin-top: -6px !important;
      background-color: ${colors.primaryWhite} !important;
    }

    &__input {
      height: 36px !important;
      width: auto !important;
      max-width: 75px;
      border: 1px solid ${colors.darkGrey} !important;
      color: ${colors.primaryWhite} !important;
      background-color: ${colors.secondaryBlack} !important;
      font-family: LinearSans;
      font-size: 14px;
      caret-color: white;
    }

    &__plot {
      margin-bottom: 5px;
    }
  }
`;

const Container = styled.div`
  overflow-y: scroll;
  position: relative;
  overflow-x: hidden;
  width: calc(100% + 12px);
  padding-right: 13px;
  z-index: 2;
  background-color: ${colors.secondaryBlack};
  height: calc(100vh - 230px);

  ::-webkit-scrollbar-track {
    background: ${colors.secondaryBlack};
  }

  ::-webkit-scrollbar-thumb {
    border: 1px solid ${colors.grey};
    background-color: #d8d8d8;
  }

  ::-webkit-scrollbar {
    width: 2px;
  }
`;

const StyledTrashIcon = styled.i`
  display: inline-block;
  background-image: url(${TrashIcon});
  background-repeat: no-repeat;
  background-position: center;
  width: 15px;
  height: 15px;
  position: absolute;
  top: 24px;
  right: 12px;
  cursor: pointer;

  &:hover {
    ${styles.blueFilter}
  }
`;

const FilterPanelWrapper = styled.div`
  position: relative;
`;

const FilterText = styled.div`
  font-size: 12px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  margin-bottom: 8px;

  b {
    white-space: nowrap;
  }
`;

const EnrichmentOutdatedText = styled(FilterText)`
  margin-top: 8px;

  a {
    color: ${colors.primaryWhite};
    text-decoration: underline;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
`;

function CustomFilterManagerFactory(_: any, FilterPanel: any) {
  // the below function is copied from kepler.gl/src/components/side-panel/filter-manager.js with few updates
  const CustomFilterManager = ({ filters = [], datasets, layers, visStateActions }: Props) => {
    const {
      addFilter,
      enlargeFilter,
      removeFilter,
      setFilter,
      toggleAnimation,
      toggleFilterFeature,
    } = visStateActions;
    const isAnyFilterAnimating = filters.some((f: any) => f.isAnimating);
    const hadEmptyFilter = filters.some((f: any) => !f.name);
    const hadDataset = Object.keys(datasets).length;
    const onClickAddFilter = useCallback(
      (datasetId: string) => {
        addFilter(datasetId);
      },
      [addFilter],
    );
    const { selectedClimateData } = useMapData();
    const {
      datasetEnrichmentInfo,
      enrichmentMessage,
      enrichmentSubTitle,
      showEnrich,
      showReload,
      showLoading,
      onEnrichClick,
      onReloadClick,
      setDatasetEnrichmentInfo,
      onConfrimEnrich,
    } = useEnrich();
    const filteredProjectDatasets = useAppSelector(
      (state) => state.project.filteredProjectDatasets,
    );
    const filtersByDataset = useMemo<{
      [dataset_id: string]: {
        filters: Filter[];
        hasThresholdFilter: boolean;
        originalThresholdFilterIdx: number;
      };
    }>(() => {
      if (!datasets) {
        return {};
      }
      // initialize the object that maps each datasets with an array of filters
      const datasetFilters: {
        [dataset_id: string]: {
          filters: Filter[];
          hasThresholdFilter: boolean;
          originalThresholdFilterIdx: number;
        };
      } = Object.keys(datasets).reduce((grouped, datasetId) => {
        grouped[datasetId] = {
          filters: [],
          hasThresholdFilter: false,
          originalThresholdFilterIdx: -1,
        };
        return grouped;
      }, Object.assign({}));

      // Add filters to their corresponding dataset. Render first added filter first.
      filters.forEach((filter) => {
        datasetFilters[filter.dataId[0]].filters.push(filter);
      });

      // For each dataset, move the climate filter to the beginning of filters array
      Object.keys(datasetFilters).forEach((dataId) => {
        const climateFilterIndex = datasetFilters[dataId].filters.findIndex((filter) => {
          let foundClimateFilter = false;
          DEGREES.forEach((degree) => {
            DATA_VALUES.forEach((bin) => {
              const climateDataField = getFilterName(degree, datasets[dataId], bin as BinningType);
              foundClimateFilter =
                foundClimateFilter ||
                (climateDataField ? filter.name.includes(climateDataField) : false);
            });
          });
          return foundClimateFilter;
        });
        if (climateFilterIndex !== -1) {
          datasetFilters[dataId].filters.unshift(
            datasetFilters[dataId].filters.splice(climateFilterIndex, 1)[0],
          );
          datasetFilters[dataId].hasThresholdFilter = true;
          datasetFilters[dataId].originalThresholdFilterIdx = filters.findIndex(
            (f) => f.id === datasetFilters[dataId].filters[0].id,
          );
        }
      });

      return datasetFilters;
    }, [filters, datasets]);

    const onSliderValueChange = (newValue: number | number[], index: number) => {
      setFilter(index, "value", newValue);
    };

    const renderFilterSummary = (dataset: KeplerTable) => (
      <FilterText>
        Showing {dataset.filteredIndexForDomain.length} of {dataset.allIndexes.length} data points
        from your <b>{dataset.label}</b> dataset.
      </FilterText>
    );

    const isEnrichmentOutdated = useCallback(
      (index: number, dataset: any) => {
        return (
          !showLoading(index) &&
          dataset.hasThresholdFilter &&
          selectedClimateData &&
          selectedClimateData?.createdAt! > filteredProjectDatasets[index].enrichmentCreatedAt
        );
      },
      [filteredProjectDatasets, selectedClimateData, showLoading],
    );

    const renderEnrichOrReloadButton = (index: number, dataId: string, dataset: any) => {
      if (!showReload(index) && !showLoading(index) && showEnrich(index)) {
        return (
          <Button
            className="add-filter-button"
            inactive={hadEmptyFilter || !hadDataset}
            onClick={() => onEnrichClick(index, dataId)}
          >
            Enrich to filter
          </Button>
        );
      } else if (showReload(index)) {
        return (
          <Button
            className="add-filter-button"
            inactive={hadEmptyFilter || !hadDataset}
            onClick={onReloadClick}
          >
            Reload to filter
          </Button>
        );
      } else if (isEnrichmentOutdated(index, dataset)) {
        return (
          <Button className="add-filter-button" onClick={() => onEnrichClick(index, dataId, true)}>
            Enrich to update
          </Button>
        );
      }
      return null;
    };

    // show this message if a new climate data version has been added, and the dataset was enriched before this addition.
    const renderOutDatedEnrichmentText = (index: number, dataset: any) => {
      if (isEnrichmentOutdated(index, dataset)) {
        return (
          <EnrichmentOutdatedText>
            Good news! This climate map has been updated. Enrich to update your map with the latest
            cliamte data.{" "}
            <a target="_blank" rel="noopener noreferrer" href={MAP_VERSION_URL}>
              Learn more.
            </a>
          </EnrichmentOutdatedText>
        );
      }
      return null;
    };

    return (
      <>
        <Container>
          {Object.keys(filtersByDataset).map((datasetId, index) => {
            const dataset = filtersByDataset[datasetId];
            return (
              <DatasetTitle dataset={datasets[datasetId]} section="filters" key={index}>
                <>
                  {renderFilterSummary(datasets[datasetId])}
                  {!dataset.hasThresholdFilter && !showLoading(index) && (
                    <FilterText>
                      Enrich to filter with both your data and this climate map.
                    </FilterText>
                  )}
                  {selectedClimateData && dataset.hasThresholdFilter && (
                    <ThresholdFilter
                      onSliderValueChange={(value: number[]) =>
                        onSliderValueChange(value, dataset.originalThresholdFilterIdx)
                      }
                      filter={dataset.filters[0]}
                      min={selectedClimateData.dataset.minValue}
                      max={selectedClimateData.dataset.maxValue}
                      unit={selectedClimateData.dataset.unit}
                    />
                  )}
                  {renderOutDatedEnrichmentText(index, dataset)}
                  {showLoading(index) && <DatasetLoader />}
                </>
                <StyledFilterManagerContainer>
                  <div className="filter-manager">
                    <SidePanelSection>
                      {dataset.filters
                        .slice(dataset.hasThresholdFilter ? 1 : 0)
                        .map((filter, idx) => {
                          if (!filter) {
                            return null;
                          }
                          const originalIdx = filters.findIndex((f) => f.id === filter.id);
                          return (
                            <FilterPanelWrapper key={`${filters[originalIdx].id}-${idx}`}>
                              <FilterPanel
                                key={`${filters[originalIdx].id}-${idx}`}
                                idx={originalIdx}
                                filters={filters}
                                filter={filters[originalIdx]}
                                datasets={datasets}
                                layers={layers}
                                isAnyFilterAnimating={isAnyFilterAnimating}
                                removeFilter={() => removeFilter(originalIdx)}
                                enlargeFilter={() => enlargeFilter(originalIdx)}
                                toggleAnimation={() => toggleAnimation(originalIdx)}
                                toggleFilterFeature={() => toggleFilterFeature(originalIdx)}
                                setFilter={setFilter}
                              />
                              <StyledTrashIcon
                                onClick={() => {
                                  removeFilter(originalIdx);
                                }}
                              />
                            </FilterPanelWrapper>
                          );
                        })}
                    </SidePanelSection>
                  </div>
                  <ButtonContainer>
                    {renderEnrichOrReloadButton(index, datasetId, dataset)}
                    <Button
                      className="add-filter-button"
                      inactive={hadEmptyFilter || !hadDataset}
                      width="105px"
                      onClick={() => onClickAddFilter(datasetId)}
                    >
                      Add New
                    </Button>
                  </ButtonContainer>
                </StyledFilterManagerContainer>
              </DatasetTitle>
            );
          })}
        </Container>
        <PfProLogo />
        <ConfirmationModal
          isOpen={datasetEnrichmentInfo !== undefined}
          title="Enrich Dataset"
          message={enrichmentMessage}
          subTitle={enrichmentSubTitle}
          onCancel={() => setDatasetEnrichmentInfo(undefined)}
          onConfirm={onConfrimEnrich}
        />
      </>
    );
  };
  return CustomFilterManager;
}

CustomFilterManagerFactory.deps = FilterManagerFactory.deps;

export default CustomFilterManagerFactory;
