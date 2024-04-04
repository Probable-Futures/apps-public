import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { types } from "@probable-futures/lib";
import Papa from "papaparse";

import { PUBLISHED_MAPS_QUERY } from "../graphql/queries/maps";
import { GRAPHQL_API_KEY } from "../consts/env";
import {
  CREATE_PF_COUNTRY_STATISTICS,
  VIEW_PF_COUNTRY_STATISTICS_BY_COUNTRY_AND_DATASET,
  VIEW_PF_COUNTRY_STATISTICS_BY_ID,
  COUNTRIES,
} from "../graphql/queries/country";
import { GET_DATASET_SIGNED_URLS } from "../graphql/queries/datasets";
import { GqlResponse } from "../shared/types";
import { FileFormatOption } from "../components/Dashboard/Dataset/DownloadPfDataModal";

export type IncludeColumnType = {
  name: string;
  checked: boolean;
  label: string;
  options: string[];
};

export type Country = {
  name: string;
  iso_a2: string;
  iso_a3: string;
  id: string;
};

type CountryStatistics = {
  id: string;
  datasetId: number;
  countryId: string;
  fileUrl: string;
  status: "requested" | "in progress" | "failed" | "successful";
};

type PFMapsResponse = {
  pfMaps: GqlResponse<types.Map>;
};

type CountryStatisticsResponse = {
  createPfCountryStatistics: { pfCountryStatistics: CountryStatistics[] };
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
  const [country, setCountry] = useState<Country>();
  const [datasetToDownload, setDatasetToDownload] = useState<types.Map>();
  const [isDatasetDownloadModalOpen, setIsDatasetDownloadModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [inProgressData, setInProgressData] = useState<{
    country: Country;
    dataset: types.Map;
    includeColumns: IncludeColumnType[];
    fileFormatOption: FileFormatOption;
  }>();
  const [countryStatisticsFromCreate, setCountryStatisticsFromCreate] =
    useState<CountryStatistics>();
  const [includeColumns, setIncludeColumns] = useState<IncludeColumnType[]>(
    structuredClone(defaultCSVColumns),
  );

  const getNameFromUrl = useCallback(
    (fileUrl: string) => {
      const name = new URL(fileUrl).pathname.split("/").pop() || "";
      if (!name && inProgressData?.fileFormatOption === "csv") {
        return `${inProgressData.country?.name.replaceAll(
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
  const { data: countries } = useQuery<{ countries: { nodes: Country[] } }>(COUNTRIES, {
    context: {
      headers: {
        "api-key": GRAPHQL_API_KEY,
      },
    },
  });

  const [getSignedUrls] = useMutation(GET_DATASET_SIGNED_URLS);

  const [createPfCountryStatistics] = useMutation<CountryStatisticsResponse>(
    CREATE_PF_COUNTRY_STATISTICS,
    {
      onCompleted(data) {
        if (data?.createPfCountryStatistics?.pfCountryStatistics) {
          setCountryStatisticsFromCreate(data.createPfCountryStatistics.pfCountryStatistics[0]);
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

  const [getPfCountryStatistics] = useLazyQuery<{
    viewPfCountryStatistics: { nodes: CountryStatistics[] };
  }>(VIEW_PF_COUNTRY_STATISTICS_BY_COUNTRY_AND_DATASET);

  const { startPolling, stopPolling } = useQuery<{
    viewPfCountryStatistics: { nodes: CountryStatistics[] };
  }>(VIEW_PF_COUNTRY_STATISTICS_BY_ID, {
    skip:
      !inProgressData?.dataset ||
      !inProgressData?.country ||
      countryStatisticsFromCreate === null ||
      countryStatisticsFromCreate === undefined ||
      !!(countryStatisticsFromCreate && countryStatisticsFromCreate.fileUrl),
    variables: {
      id: countryStatisticsFromCreate?.id,
    },
    onCompleted: async (data) => {
      if (data?.viewPfCountryStatistics?.nodes) {
        const countryStatistics = data.viewPfCountryStatistics.nodes[0];
        if (!countryStatistics) {
          return;
        }
        if (countryStatistics.status === "successful" && countryStatistics.fileUrl) {
          stopPolling();
          setCountryStatisticsFromCreate(undefined);
          const signedUrl = await getSignedUrl(
            decodeURIComponent(new URL(countryStatistics.fileUrl).pathname).substring(1),
          );
          handleDownload(signedUrl);
        } else if (countryStatistics.status === "failed") {
          setCountryStatisticsFromCreate(undefined);
          stopPolling();
          setErrorMessage("Error occured, please downloading the file again.");
        }
      }
    },
  });

  const onDownloadDatasetModalClose = () => {
    setIsDatasetDownloadModalOpen(false);
    setIncludeColumns(structuredClone(defaultCSVColumns));
    setErrorMessage("");
    setDatasetToDownload(undefined);
    setCountry(undefined);
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
      const countryCopy = country ? structuredClone(country) : undefined;
      const datasetCopy = structuredClone(datasetToDownload);
      const includeColumnsCopy = structuredClone(includeColumns);
      setInProgressData({
        country: countryCopy!,
        dataset: datasetCopy,
        includeColumns: includeColumnsCopy,
        fileFormatOption,
      });
    },
    [country, inProgressData, includeColumns, datasetToDownload],
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
      // Downloading data by country only supported for CSV file formats
      if (inProgressData?.country && inProgressData.fileFormatOption === "csv") {
        // If a file is already created for this country get its url. Else call createPfCountryStatistics to start creating the file in background.
        const res = await getPfCountryStatistics({
          variables: {
            countryId: inProgressData.country.id,
            datasetId: inProgressData.dataset.dataset.id,
          },
        });
        if (res.data && res.data.viewPfCountryStatistics.nodes.length > 0) {
          const countryData = res.data.viewPfCountryStatistics.nodes?.find(
            (cd) => cd.status === "successful" && cd.fileUrl,
          );
          if (countryData) {
            const signedUrl = await getSignedUrl(
              decodeURIComponent(new URL(countryData.fileUrl).pathname).substring(1),
            );
            return handleDownload(signedUrl);
          }
        }
        await createPfCountryStatistics({
          variables: {
            countryId: inProgressData.country.id,
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
    createPfCountryStatistics,
    getPfCountryStatistics,
    handleDownload,
    getSignedUrl,
  ]);

  useEffect(() => {
    const handleCountryStatisticsCreated = async () => {
      // if file alreay exists
      if (countryStatisticsFromCreate && countryStatisticsFromCreate.fileUrl) {
        const signedUrl = await getSignedUrl(
          decodeURIComponent(new URL(countryStatisticsFromCreate.fileUrl).pathname).substring(1),
        );
        setCountryStatisticsFromCreate(undefined);
        handleDownload(signedUrl);
      } else if (countryStatisticsFromCreate && !countryStatisticsFromCreate.fileUrl) {
        // start polling and wait for the file to be created and pushed to S3
        startPolling(pollingInterval);
      }
    };
    if (countryStatisticsFromCreate) {
      handleCountryStatisticsCreated();
    }
  }, [countryStatisticsFromCreate, getSignedUrl, handleDownload, startPolling]);

  return {
    datasetToDownload,
    mapsResponse,
    countries,
    isDatasetDownloadModalOpen,
    includeColumns,
    errorMessage,
    country,
    inProgressData,
    fileStatus,
    showDetails,
    onDownloadPfDataClick,
    onDownloadDatasetModalClose,
    setIncludeColumns,
    setCountry,
    onDownloadPfData,
    onShowDetailsToggle,
  };
}
