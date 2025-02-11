import styled from "styled-components";
import Snackbar from "@mui/material/Snackbar";
import { Alert } from "@mui/material";

import DashboardTitle from "../../Common/DashboardTitle";
import Item from "./Item";
import DownloadPfDataModal from "./DownloadPfDataModal";
import useDownloadPfData from "../../../utils/useDownloadPfData";
import { colors } from "../../../consts";

const Loader = styled.div`
  position: fixed;
  bottom: 10px;
  right: 20px;
  z-index: 1;
  padding: 10px;
  text-align: center;
  background: ${colors.primaryWhite};
  border-radius: 10px 0 0 0;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.5);
`;

const LoaderText = styled.div`
  font-size: 14px;
`;

const LoaderButton = styled.button`
  cursor: pointer;
  margin-top: 10px;
  color: ${colors.primaryWhite};
  background-color: ${colors.secondaryBlack};
  border: none;
  padding: 5px;
`;

const Description = styled.div`
  margin: 20px 0px;
  line-height: 1.55;
`;

const Datasets = () => {
  const {
    datasetToDownload,
    mapsResponse,
    geoPlaces,
    isDatasetDownloadModalOpen,
    includeColumns,
    errorMessage,
    inProgressData,
    fileStatus,
    showDetails,
    isToastOpen,
    onDownloadPfDataClick,
    onDownloadDatasetModalClose,
    setIncludeColumns,
    setGeoPlace,
    onDownloadPfData,
    onShowDetailsToggle,
    setIsToastOpen,
  } = useDownloadPfData();

  return (
    <>
      <div>
        <DashboardTitle title="Climate data" />
        <Description>
          The datasets below contain the same data as the publicly available{" "}
          <a href="https://probablefutures.org/maps/" target="_blank" rel="noopener noreferrer">
            Probable Futures maps
          </a>
          . Here, the datasets are available to download in various formats. To understand the data
          contained in these datasets, please read{" "}
          <a
            href="https://docs.probablefutures.org/background-data-and-maps/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation: The data and maps
          </a>
          .
        </Description>
        {mapsResponse?.pfMaps?.nodes.length &&
          mapsResponse.pfMaps.nodes.map((pfmap, index) => (
            <Item
              key={index}
              index={index}
              name={pfmap.name}
              onDownload={onDownloadPfDataClick}
              onTitleClick={onDownloadPfDataClick}
            />
          ))}
      </div>
      {datasetToDownload && geoPlaces && isDatasetDownloadModalOpen && (
        <DownloadPfDataModal
          includeColumns={includeColumns}
          datasetToDownload={datasetToDownload}
          geoPlaces={geoPlaces.geoPlaces.nodes}
          onModalClose={onDownloadDatasetModalClose}
          setIncludeColumns={setIncludeColumns}
          setGeoPlace={setGeoPlace}
          onDownloadClick={onDownloadPfData}
          errorMessage={errorMessage}
          modalOpen={isDatasetDownloadModalOpen}
        />
      )}
      <Snackbar open={isToastOpen} autoHideDuration={6000} onClose={() => setIsToastOpen(false)}>
        <Alert
          onClose={() => setIsToastOpen(false)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
      {inProgressData && (
        <Loader>
          <LoaderText>
            <b>Creating file...</b>
          </LoaderText>
          <LoaderButton onClick={onShowDetailsToggle}>
            {showDetails ? "Hide details" : "View details"}
          </LoaderButton>
          {showDetails && (
            <div>
              <LoaderText>
                <b>Dataset:</b> {inProgressData.dataset.name}
              </LoaderText>
              {inProgressData.geoPlace && (
                <LoaderText>
                  <b>Place:</b> {inProgressData.geoPlace.name}
                </LoaderText>
              )}
              <LoaderText>
                <b>Status:</b> {fileStatus}
              </LoaderText>
            </div>
          )}
        </Loader>
      )}
    </>
  );
};

export default Datasets;
