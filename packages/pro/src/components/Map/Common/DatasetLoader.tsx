import { LinearProgress } from "@mui/material";
import { useCallback, useEffect } from "react";
import styled from "styled-components";

import { colors } from "../../../consts";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { SET_DATASET_ENRICHMENT } from "../../../store/actions";

const LoaderContainer = styled.div`
  display: flex;
  color: ${colors.midGrey};
  font-style: italic;
  padding: 12px;
`;

const InnerContainer = styled.div`
  font-weight: 600;
  letter-spacing: 0;
  line-height: 25px;
`;

const BorderLinearProgress = styled(LinearProgress)`
  &.MuiLinearProgress-root {
    box-sizing: border-box;
    border: 1px solid ${colors.darkPurple};
    margin: 0 auto;
  }
  .MuiLinearProgress-barColorPrimary {
    background-color: ${colors.blue};
  },
`;

const SingleBorderLinearProgress = styled(BorderLinearProgress)`
  &.MuiLinearProgress-root {
    height: 4px;
    width: 245px;
    background-color: ${colors.secondaryBlack};
  }
`;

const AdditionalInfo = styled.p`
  font-size: 10px;
  line-height: 16px;
  max-width: 293px;
`;

const renderLoader = (progess: number) => (
  <LoaderContainer>
    <InnerContainer>
      <SingleBorderLinearProgress variant="determinate" value={progess} />
      <AdditionalInfo>
        Enrichment in progress. This might take a while. Feel free to explore the map in the
        meantime!
      </AdditionalInfo>
    </InnerContainer>
  </LoaderContainer>
);

const intervalTime = 500;

const DatasetLoader = () => {
  const dispatch = useAppDispatch();
  const datasetEnrichment = useAppSelector((state) => state.project.datasetEnrichment);
  const fileSizes = useAppSelector((state) => state.project.fileSizes);

  const getProcessingTime = useCallback(() => {
    let time = 0;
    if (datasetEnrichment.index === undefined) {
      return time;
    }

    const totalSizeInBytes = fileSizes[datasetEnrichment.index];
    // Convert total size to MB as we assume every 1 MB will take 0.9 mins
    // set a minimum of 0.5 min no matter how small the file since it is going through the process
    time = Math.max((totalSizeInBytes / (1024 * 1024)) * 0.9, 0.5);

    // convert time from mins to ms
    time = time * 60 * 1000;

    return time;
  }, [datasetEnrichment.index, fileSizes]);

  const getEnrichmenTime = useCallback(() => {
    if (!datasetEnrichment.processedWithCoodridatesRowCount) {
      return 0;
    }
    let time = datasetEnrichment.processedWithCoodridatesRowCount / 50000 / 3;
    if (datasetEnrichment.processedWithCoodridatesRowCount < 10000) {
      time = 0.5;
    } else if (
      datasetEnrichment.processedWithCoodridatesRowCount >= 10000 &&
      datasetEnrichment.processedWithCoodridatesRowCount <= 50000
    ) {
      time = 1;
    }

    return time;
  }, [datasetEnrichment.processedWithCoodridatesRowCount]);

  useEffect(() => {
    let time =
      datasetEnrichment.enrichmentStatus === "in progress"
        ? getEnrichmenTime()
        : getProcessingTime();
    const timer = setInterval(() => {
      let newProgress = 0;
      if (datasetEnrichment.enrichmentProgress === 100) {
        newProgress = 100;
      } else {
        let diff = Math.random() * 1;
        if (time) {
          diff = 100 / (time / intervalTime);
        }
        newProgress = Math.min(datasetEnrichment.enrichmentProgress + diff, 100);
      }
      dispatch({
        type: SET_DATASET_ENRICHMENT,
        payload: {
          datasetEnrichment: { enrichmentProgress: newProgress },
        },
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [
    datasetEnrichment.enrichmentStatus,
    datasetEnrichment.enrichmentProgress,
    dispatch,
    getEnrichmenTime,
    getProcessingTime,
  ]);

  return renderLoader(datasetEnrichment.enrichmentProgress);
};

export default DatasetLoader;
