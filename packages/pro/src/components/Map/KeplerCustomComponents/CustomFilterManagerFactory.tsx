import { useCallback, useMemo } from "react";
import styled from "styled-components";
import {
  SidePanelSection,
  Button,
  FilterManagerFactory,
  FilterPanelFactory,
  FilterManagerProps,
  DatasetSectionFactory,
} from "@kepler.gl/components";
import { styles } from "@probable-futures/components-lib";
import { MAP_VERSION_URL } from "@probable-futures/lib/src/consts";
import { BinningType } from "@probable-futures/lib/src/utils";
import { Filter } from "@kepler.gl/types";
import { KeplerTable } from "@kepler.gl/table";

import TrashIcon from "../../../assets/icons/map/trash.svg";
import DatasetTitle from "../Common/DatasetTitle";
import { colors } from "../../../consts";
import ThresholdFilter from "../Filter/ThresholdFilter";
import { useMapData } from "../../../contexts/DataContext";
import { PfProLogo } from "../../Common";
import { getFilterName } from "../../../utils/useDatasetFilter";
import { useAppSelector } from "../../../app/hooks";
import useEnrich from "../../../utils/useEnrich";
import ConfirmationModal from "../../Common/ConfirmationModal";
import DatasetLoader from "../Common/DatasetLoader";
import { DATA_VALUES, DEGREES } from "../../../consts/MapConsts";
import { TabTitle } from "../../../shared/styles/styles";

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

  .add-filter-button {
    color: ${colors.primaryWhite};
    font-family: LinearSans;
    font-size: 14px;
    letter-spacing: 0;
    text-align: center;
    background: transparent;
    border: 1px solid white;
    cursor: pointer;
    background-color: transparent !important;

    .data-ex-icons-add {
      display: none;
    }

    &:hover {
      border: 1px solid ${colors.secondaryBlue};
      color: ${colors.secondaryBlue};
      background-color: transparent;
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

type DatasetFilters = {
  filters: Filter[];
  hasThresholdFilter: boolean;
  originalThresholdFilterIdx: number;
};
type FiltersByDataset = {
  [dataset_id: string]: DatasetFilters;
};

function CustomFilterManagerFactory(
  _DatasetSection: ReturnType<typeof DatasetSectionFactory>,
  FilterPanel: ReturnType<typeof FilterPanelFactory>,
) {
  // the below function is copied from kepler.gl/src/components/side-panel/filter-manager.js with few updates
  const CustomFilterManager = ({
    filters = [],
    datasets,
    layers,
    visStateActions,
  }: FilterManagerProps) => {
    const { addFilter, removeFilter, setFilter, toggleFilterFeature } = visStateActions;
    const isAnyFilterAnimating = filters.some((f) => f.isAnimating);
    const hadEmptyFilter = filters.some((f) => !f.name);
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
    const filtersByDataset = useMemo<FiltersByDataset>(() => {
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
      (index: number, dataset: DatasetFilters) => {
        return (
          !showLoading(index) &&
          dataset.hasThresholdFilter &&
          selectedClimateData &&
          selectedClimateData?.createdAt! > filteredProjectDatasets[index].enrichmentCreatedAt
        );
      },
      [filteredProjectDatasets, selectedClimateData, showLoading],
    );

    const renderEnrichOrReloadButton = (index: number, dataId: string, dataset: DatasetFilters) => {
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
    const renderOutDatedEnrichmentText = (index: number, dataset: DatasetFilters) => {
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
          <TabTitle>Filters</TabTitle>
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
                                enlargeFilter={() => {}}
                                toggleAnimation={() => {}}
                                toggleFilterFeature={() => toggleFilterFeature(originalIdx)}
                                setFilter={setFilter}
                                setFilterPlot={() => {}}
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
