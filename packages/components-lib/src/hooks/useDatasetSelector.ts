import { useState, useEffect, useMemo } from "react";
import { Map } from "@probable-futures/lib";
import { generateGroupedDatasets } from "../utils/dataset";

type Props = {
  datasets: Map[];
  translatedDatasets?: any;
};

const useDatasetSelctor = ({ datasets, translatedDatasets }: Props) => {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [animateAccordionTitle, setAnimateAccordionTitle] = useState(false);

  const groupedDatasets = useMemo(
    () => generateGroupedDatasets(datasets, translatedDatasets),
    [datasets, translatedDatasets],
  );

  const toggleSection = (newLabel: string) => {
    if (openSections.includes(newLabel)) {
      setOpenSections((prev) => prev.filter((label) => label !== newLabel));
    } else {
      setOpenSections((prev) => [...prev, newLabel]);
    }
  };

  const collapseAll = () => {
    setOpenSections([]);
  };

  const expandAll = () => {
    groupedDatasets.forEach((section) => {
      if (!openSections.includes(section.label)) {
        setOpenSections((prev) => [...prev, section.label]);
      }
    });
  };

  const isAllExpanded = useMemo(
    () => groupedDatasets.every((section) => openSections.includes(section.label)),
    [groupedDatasets, openSections],
  );

  const toggleAllSections = () => {
    setSelectMode((prev) => !prev);
    collapseAll();
  };

  useEffect(() => {
    setAnimateAccordionTitle(true);
    const timeout = setTimeout(() => setAnimateAccordionTitle(false), 400);
    return () => clearTimeout(timeout);
  }, [selectMode]);

  return {
    animateAccordionTitle,
    isAllExpanded,
    groupedDatasets,
    selectMode,
    openSections,
    setSelectMode,
    expandAll,
    toggleSection,
    toggleAllSections,
    collapseAll,
  };
};

export default useDatasetSelctor;
