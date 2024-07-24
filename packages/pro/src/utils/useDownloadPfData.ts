import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { types } from "@probable-futures/lib";
import Papa from "papaparse";

import { PUBLISHED_MAPS_QUERY } from "../graphql/queries/maps";
import { GRAPHQL_API_KEY } from "../consts/env";
import {
  CREATE_PF_GEO_PLACE_STATISTICS,
  VIEW_PF_GEO_PLACE_STATISTICS_BY_GEO_PLACE_AND_DATASET,
  VIEW_PF_GEO_PLACE_STATISTICS_BY_ID,
  GEO_PLACES,
} from "../graphql/queries/geoPlace";
import { GET_DATASET_SIGNED_URLS } from "../graphql/queries/datasets";
import { GqlResponse } from "../shared/types";
import { FileFormatOption } from "../components/Dashboard/Dataset/DownloadPfDataModal";

export type IncludeColumnType = {
  name: string;
  checked: boolean;
  label: string;
  options: string[];
};

export type GeoPlace = {
  name: string;
  isoA2: string;
  isoA3: string;
  id: string;
  geoPlaceType: "country" | "state" | "county";
  properties: { [key: string]: string };
};

type GeoPlaceStatistics = {
  id: string;
  datasetId: number;
  geoPlaceId: string;
  fileUrl: string;
  status: "requested" | "in progress" | "failed" | "successful";
};

type PFMapsResponse = {
  pfMaps: GqlResponse<types.Map>;
};

type GeoPlaceStatisticsResponse = {
  createPfGeoPlaceStatistics: { pfGeoPlaceStatistics: GeoPlaceStatistics[] };
};

const defaultCSVColumns = [
  {
    name: "lowValue",
    checked: true,
    label: "Include low values",
    options: [
      "low_value_0_5c",
      "low_value_1c",
      "low_value_1_5c",
      "low_value_2c",
      "low_value_2_5c",
      "low_value_3c",
    ],
  },
  {
    name: "midValues",
    checked: true,
    label: "Include mid values",
    options: [
      "mid_value_0_5c",
      "mid_value_1c",
      "mid_value_1_5c",
      "mid_value_2c",
      "mid_value_2_5c",
      "mid_value_3c",
    ],
  },
  {
    name: "highValues",
    checked: true,
    label: "Include high values",
    options: [
      "high_value_0_5c",
      "high_value_1c",
      "high_value_1_5c",
      "high_value_2c",
      "high_value_2_5c",
      "high_value_3c",
    ],
  },
  {
    name: "cell",
    checked: true,
    label: "Include polygon coordinates of grid cells",
    options: ["cell"],
  },
];
const pollingInterval = 7000;

export default function useDownloadPfData() {
  // State variables
  const [geoPlace, setGeoPlace] = useState<GeoPlace>();
  const [datasetToDownload, setDatasetToDownload] = useState<types.Map>();
  const [isDatasetDownloadModalOpen, setIsDatasetDownloadModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [inProgressData, setInProgressData] = useState<{
    geoPlace: GeoPlace;
    dataset: types.Map;
    includeColumns: IncludeColumnType[];
    fileFormatOption: FileFormatOption;
  }>();
  const [geoPlaceStatisticsFromCreate, setGeoPlaceStatisticsFromCreate] =
    useState<GeoPlaceStatistics>();
  const [includeColumns, setIncludeColumns] = useState<IncludeColumnType[]>(
    structuredClone(defaultCSVColumns),
  );

  const [isToastOpen, setIsToastOpen] = useState(false);

  const getNameFromUrl = useCallback(
    (fileUrl: string) => {
      const name = new URL(fileUrl).pathname.split("/").pop() || "";
      if (!name && inProgressData?.fileFormatOption === "csv") {
        return `${inProgressData.geoPlace?.name.replaceAll(
          " ",
          "_",
        )}-${inProgressData.dataset.name.replaceAll(" ", "_")}.csv`;
      }
      return name;
    },
    [inProgressData],
  );

  // Fetch and load the file in memory, exclude the columns selected by the user, and download the file.
  const filterColumnsAndDownload = useCallback(
    async (fileUrl: string) => {
      if (!inProgressData) {
        return;
      }
      const response = await fetch(fileUrl, { mode: "cors" });
      const fileText = await response.text();
      const parsedData = Papa.parse(fileText, { header: true });
      const columnsToExclude = inProgressData.includeColumns.filter((column) => !column.checked);
      let excludedColumns: string[] = [];
      for (let i = 0; i < columnsToExclude.length; i++) {
        excludedColumns = excludedColumns.concat(columnsToExclude[i].options);
      }
      // Remove columns from CSV data
      const filteredData = parsedData.data.map((row: any) => {
        excludedColumns.forEach((column) => {
          delete row[column];
        });
        return row;
      });

      // Convert filtered data back to CSV format
      const csv = Papa.unparse(filteredData);

      // Download the filtered CSV data
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", getNameFromUrl(fileUrl));
      document.body.appendChild(link);
      link.click();
    },
    [inProgressData, getNameFromUrl],
  );

  const handleDownload = useCallback(
    async (fileUrl: string) => {
      if (!inProgressData) {
        return;
      }
      if (
        inProgressData.fileFormatOption === "csv" &&
        inProgressData.includeColumns.find((column) => !column.checked)
      ) {
        await filterColumnsAndDownload(fileUrl);
      } else {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.target = "_blank";
        link.download = getNameFromUrl(fileUrl);
        link.click();
      }
      setInProgressData(undefined);
    },
    [inProgressData, filterColumnsAndDownload, getNameFromUrl],
  );

  // Queries and mutations
  const { data: geoPlaces } = useQuery<{ geoPlaces: { nodes: GeoPlace[] } }>(GEO_PLACES, {
    context: {
      headers: {
        "api-key": GRAPHQL_API_KEY,
      },
    },
  });

  const [getSignedUrls] = useMutation(GET_DATASET_SIGNED_URLS);

  const [createPfGeoPlaceStatistics] = useMutation<GeoPlaceStatisticsResponse>(
    CREATE_PF_GEO_PLACE_STATISTICS,
    {
      onCompleted(data) {
        if (data?.createPfGeoPlaceStatistics?.pfGeoPlaceStatistics) {
          setGeoPlaceStatisticsFromCreate(data.createPfGeoPlaceStatistics.pfGeoPlaceStatistics[0]);
        }
      },
    },
  );

  const { data: mapsResponse } = useQuery<PFMapsResponse>(PUBLISHED_MAPS_QUERY, {
    context: {
      headers: {
        "api-key": GRAPHQL_API_KEY,
      },
    },
  });

  const [getPfGeoPlaceStatistics] = useLazyQuery<{
    viewPfGeoPlaceStatistics: { nodes: GeoPlaceStatistics[] };
  }>(VIEW_PF_GEO_PLACE_STATISTICS_BY_GEO_PLACE_AND_DATASET);

  const { startPolling, stopPolling } = useQuery<{
    viewPfGeoPlaceStatistics: { nodes: GeoPlaceStatistics[] };
  }>(VIEW_PF_GEO_PLACE_STATISTICS_BY_ID, {
    skip:
      !inProgressData?.dataset ||
      !inProgressData?.geoPlace ||
      geoPlaceStatisticsFromCreate === null ||
      geoPlaceStatisticsFromCreate === undefined ||
      !!(geoPlaceStatisticsFromCreate && geoPlaceStatisticsFromCreate.fileUrl),
    variables: {
      id: geoPlaceStatisticsFromCreate?.id,
    },
    notifyOnNetworkStatusChange: true,
    onCompleted: async (data) => {
      if (data?.viewPfGeoPlaceStatistics?.nodes) {
        const geoPlaceStatistics = data.viewPfGeoPlaceStatistics.nodes[0];
        if (!geoPlaceStatistics) {
          return;
        }
        if (geoPlaceStatistics.status === "successful" && geoPlaceStatistics.fileUrl) {
          stopPolling();
          setGeoPlaceStatisticsFromCreate(undefined);
          const signedUrl = await getSignedUrl(
            decodeURIComponent(new URL(geoPlaceStatistics.fileUrl).pathname).substring(1),
          );
          handleDownload(signedUrl);
        } else if (geoPlaceStatistics.status === "failed") {
          setGeoPlaceStatisticsFromCreate(undefined);
          stopPolling();
          setErrorMessage("Error occured, please download the file again.");
          setIsToastOpen(true);
          setInProgressData(undefined);
        }
      }
    },
  });

  const onDownloadDatasetModalClose = () => {
    setIsDatasetDownloadModalOpen(false);
    setIncludeColumns(structuredClone(defaultCSVColumns));
    setErrorMessage("");
    setDatasetToDownload(undefined);
    setGeoPlace(undefined);
  };

  const onDownloadPfData = useCallback(
    async (fileFormatOption: FileFormatOption) => {
      if (!datasetToDownload) {
        return;
      } else if (inProgressData) {
        setErrorMessage(
          "A download is already in progress. You can only download one dataset at a time.",
        );
        return;
      }
      const geoPlaceCopy = geoPlace ? structuredClone(geoPlace) : undefined;
      const datasetCopy = structuredClone(datasetToDownload);
      const includeColumnsCopy = structuredClone(includeColumns);
      setInProgressData({
        geoPlace: geoPlaceCopy!,
        dataset: datasetCopy,
        includeColumns: includeColumnsCopy,
        fileFormatOption,
      });
    },
    [geoPlace, inProgressData, includeColumns, datasetToDownload],
  );

  const onDownloadPfDataClick = async (index: number) => {
    const pfMap = mapsResponse?.pfMaps.nodes[index];
    setDatasetToDownload(pfMap);
    setIsDatasetDownloadModalOpen(true);
  };

  const onShowDetailsToggle = () => setShowDetails((show) => !show);

  const fileStatus = useMemo(
    () => (errorMessage ? "failed" : inProgressData ? "in progress" : "successful"),
    [inProgressData, errorMessage],
  );

  const getSignedUrl = useCallback(
    async (url: string) => {
      const signedUrlsResponse = await getSignedUrls({
        variables: {
          fileUrls: [url],
          type:
            inProgressData?.fileFormatOption === "geojson"
              ? "application/ld+json"
              : inProgressData?.fileFormatOption === "netcdf"
              ? "application/x-netcdf"
              : "text/csv",
        },
      });
      const signedUrls: string[] | undefined = signedUrlsResponse.data?.datasetSignedUrls;
      if (signedUrls && signedUrls.length > 0) {
        return signedUrls[0];
      }
      return "";
    },
    [getSignedUrls, inProgressData?.fileFormatOption],
  );

  // Use Effects
  useEffect(() => {
    const proceedWithDownload = async () => {
      onDownloadDatasetModalClose();
      // Downloading data by geoPlace only supported for CSV file formats
      if (inProgressData?.geoPlace && inProgressData.fileFormatOption === "csv") {
        // If a file is already created for this geoPlace get its url. Else call createPfGeoPlaceStatistics to start creating the file in background.
        const res = await getPfGeoPlaceStatistics({
          variables: {
            geoPlaceId: inProgressData.geoPlace.id,
            datasetId: inProgressData.dataset.dataset.id,
          },
        });
        if (res.data && res.data.viewPfGeoPlaceStatistics.nodes.length > 0) {
          const geoPlaceData = res.data.viewPfGeoPlaceStatistics.nodes?.find(
            (cd) => cd.status === "successful" && cd.fileUrl,
          );
          if (geoPlaceData) {
            const signedUrl = await getSignedUrl(
              decodeURIComponent(new URL(geoPlaceData.fileUrl).pathname).substring(1),
            );
            return handleDownload(signedUrl);
          }
        }
        await createPfGeoPlaceStatistics({
          variables: {
            geoPlaceId: inProgressData.geoPlace.id,
            datasetId: inProgressData.dataset.dataset.id,
          },
        });
      }
      // Downloading full data
      else {
        let folderName = "full-data",
          extension = "csv";
        if (inProgressData?.fileFormatOption === "geojson") {
          folderName = "full-data-geojson";
          extension = "geojsonld";
        } else if (inProgressData?.fileFormatOption === "netcdf") {
          folderName = "full-data-netcdf";
          extension = "nc";
        }
        const url = `climate-data/${folderName}/${inProgressData?.dataset.slug}.${extension}`;
        const signedUrl = await getSignedUrl(url);
        if (signedUrl) {
          handleDownload(signedUrl);
        }
      }
    };
    if (inProgressData) {
      proceedWithDownload();
    }
  }, [
    inProgressData,
    createPfGeoPlaceStatistics,
    getPfGeoPlaceStatistics,
    handleDownload,
    getSignedUrl,
  ]);

  useEffect(() => {
    const handleGeoPlaceStatisticsCreated = async () => {
      // if file alreay exists
      if (geoPlaceStatisticsFromCreate && geoPlaceStatisticsFromCreate.fileUrl) {
        const signedUrl = await getSignedUrl(
          decodeURIComponent(new URL(geoPlaceStatisticsFromCreate.fileUrl).pathname).substring(1),
        );
        setGeoPlaceStatisticsFromCreate(undefined);
        handleDownload(signedUrl);
      } else if (geoPlaceStatisticsFromCreate && !geoPlaceStatisticsFromCreate.fileUrl) {
        // start polling and wait for the file to be created and pushed to S3
        startPolling(pollingInterval);
      }
    };
    if (geoPlaceStatisticsFromCreate) {
      handleGeoPlaceStatisticsCreated();
    }
  }, [geoPlaceStatisticsFromCreate, getSignedUrl, handleDownload, startPolling]);

  return {
    datasetToDownload,
    mapsResponse,
    geoPlaces,
    isDatasetDownloadModalOpen,
    includeColumns,
    errorMessage,
    geoPlace,
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
  };
}
