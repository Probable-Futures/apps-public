import React, { useMemo, useState } from "react";
import Select, { StylesConfig } from "react-select";
import camelcase from "lodash.camelcase";
import {
  HEADER_DROPDOWN_PADDING_DESKTOP,
  HEADER_DROPDOWN_PADDING_LAPTOP,
  HEADER_DROPDOWN_PADDING_MOBILE,
  HEADER_DROPDOWN_PADDING_TABLET,
  size,
  colors,
  HEADER_HEIGHT,
  customTabletSizeForHeader,
} from "@probable-futures/lib/src/consts";
import { Option, TourProps, Map } from "@probable-futures/lib/src/types";

import { DropdownIndicator } from "./CustomDropdownIndicator";
import { Control } from "./CustomSelectControl";
import { GroupHeading } from "./CustomSelectGroupHeading";
import { CustomOption } from "./CustomSelectOption";
import { useTheme } from "../../contexts";
import { groupByfield } from "@probable-futures/lib/src/utils";

type Props = {
  value: Option;
  onChange?: Function;
  tourProps?: TourProps;
  showDescriptionModal: boolean;
  datasets: Map[];
  headerText?: any;
  onInfoClick?: () => void;
};

const DatasetSelector = ({
  value,
  onChange,
  tourProps,
  showDescriptionModal,
  datasets,
  headerText,
  onInfoClick,
}: Props) => {
  const [expandedMaps, setExpandedMaps] = useState<string>();
  const [expandedCategory, setExpandedCategory] = useState<string>();
  const { theme, color, backgroundColor } = useTheme();
  const datasetOptions = useMemo(() => {
    const parentCategoryNames = headerText?.parentCategories || {};
    const datasetNames = headerText || {};
    const subCategoryNames = headerText?.subCategories || {};

    const latestDatasets = datasets.filter(({ isLatest }) => isLatest);
    const datasetsByCategory = Object.values(
      groupByfield<Map>(
        latestDatasets || [],
        "dataset.pfDatasetParentCategoryByParentCategory.label",
      ),
    ).map((parentCategories) => ({
      label: parentCategoryNames[camelcase(parentCategories.label)] || parentCategories.label,
      options: Object.values(groupByfield<Map>(parentCategories.options, "dataset.subCategory")),
    }));

    const groupedOptions = datasetsByCategory.map((category) => {
      let options: Option[] = [];
      category.options.forEach((subCategory) => {
        const subCategoryOptions = subCategory.options.map((dataset) => ({
          label: datasetNames[camelcase(dataset.slug)] || dataset.name,
          value: dataset.slug,
        }));
        if (!subCategory.label) {
          options = subCategoryOptions;
        } else {
          options.push({
            label: subCategoryNames[camelcase(subCategory.label)] || subCategory.label,
            value: subCategory.options[0].dataset.subCategory!,
            options: subCategoryOptions,
          });
        }
      });
      return {
        label: category.label,
        options: options,
      };
    });
    return groupedOptions;
  }, [datasets, headerText]);

  const customStyles: StylesConfig<Option, false> = {
    container: () => ({
      width: "100%",
      height: "100%",
      [`@media (min-width: ${customTabletSizeForHeader})`]: {
        minWidth: "425px",
        width: "fit-content",
      },
      [`@media (min-width: ${size.laptop})`]: {
        minWidth: "543px",
        width: "fit-content",
      },
      [`@media (min-width: ${size.desktop})`]: {
        minWidth: "543px",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: "20px",
      letterSpacing: 0,
      color,
      lineHeight: "29px",
      marginLeft: 0,
      marginRight: 0,
      paddingTop: "10px",
      maxWidth: "100%",
      [`@media (min-width: 1099px)`]: {
        position: "relative",
        maxWidth: "650px",
        paddingRight: "5px",
      },
      [`@media (min-width: 1441px)`]: {
        position: "relative",
        textOverflow: "unset",
        maxWidth: "auto",
        paddingRight: "40px",
      },
    }),
    option: (provided, { isSelected }) => ({
      ...provided,
      display: "flex",
      alignItems: "center",
      fontSize: "20px",
      letterSpacing: 0,
      minHeight: "48px",
      cursor: "pointer",
      color: theme === "dark" && !isSelected ? colors.white : colors.textBlack,
      paddingLeft: HEADER_DROPDOWN_PADDING_MOBILE,
      backgroundColor: isSelected ? colors.cream : "transparent",
      ":hover": {
        backgroundColor: colors.cream,
        color: colors.textBlack,
      },
      ":active": {
        backgroundColor: colors.cream,
        color: colors.textBlack,
      },
      [`@media (min-width: ${size.tablet})`]: {
        paddingLeft: HEADER_DROPDOWN_PADDING_TABLET,
      },
      [`@media (min-width: ${size.laptop})`]: {
        paddingLeft: HEADER_DROPDOWN_PADDING_LAPTOP,
        minHeight: HEADER_HEIGHT,
      },
      [`@media (min-width: ${size.desktop})`]: {
        paddingLeft: HEADER_DROPDOWN_PADDING_DESKTOP,
      },
      "&.nested-optgroup-option, &.optgroup-option": {
        fontSize: "14px !important",
        letterSpacing: 0,
        lineHeight: "32px",
        paddingTop: "0px",
        paddingBottom: "0px",
        minHeight: "32px",
      },
      "&.optgroup-option": {
        "&:last-child": {
          marginBottom: "15px",
        },
      },
    }),
    control: () => ({
      flex: "1",
      position: "relative",
      display: "flex",
      alignItems: "center",
      backgroundColor,
      height: HEADER_HEIGHT,
      cursor: "pointer",
      paddingLeft: HEADER_DROPDOWN_PADDING_MOBILE,

      [`@media (orientation: landscape)`]: {
        paddingLeft: "11px",
      },
      [`@media (min-width: ${size.tablet})`]: {
        paddingLeft: HEADER_DROPDOWN_PADDING_TABLET,
      },
      [`@media (min-width: ${size.laptop})`]: {
        paddingLeft: HEADER_DROPDOWN_PADDING_LAPTOP,
        height: HEADER_HEIGHT,
      },
      [`@media (min-width: ${size.desktop})`]: {
        paddingLeft: HEADER_DROPDOWN_PADDING_DESKTOP,
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: "42px",
      padding: 0,
    }),
    menu: () => ({
      position: "absolute",
      left: 0,
      right: 0,
      boxSizing: "border-box",
      backgroundColor,
      borderBottom: `1px solid ${colors.darkPurple}`,
      [`@media (min-width: ${size.tablet}), (orientation: landscape)`]: {
        position: "static",
        borderRight: `1px solid ${colors.darkPurple}`,
      },
      [`@media (min-width: ${size.desktop})`]: {
        borderLeft: `1px solid ${colors.darkPurple}`,
      },
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: "100vh",
      padding: 0,
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: 0,
    }),
    indicatorSeparator: () => ({ display: "none" }),
    group: () => ({
      borderTop: "1px solid #7f7f7f",
      "&:first-of-type": {
        borderTop: `1px solid ${colors.darkPurple}`,
      },
    }),
    groupHeading: (provided) => ({
      ...provided,
      padding: 0,
      marginBottom: 0,
    }),
  };

  return (
    <Select
      components={{
        Control,
        DropdownIndicator,
        GroupHeading,
        Option: CustomOption,
      }}
      value={value}
      styles={customStyles}
      options={datasetOptions}
      onMenuClose={() => {
        setExpandedCategory(undefined);
        setExpandedMaps(undefined);
      }}
      onChange={(option) => onChange && onChange(option)}
      isSearchable={false}
      {...{
        customProps: {
          expandedCategory,
          setExpandedCategory,
          expandedMaps,
          setExpandedMaps,
          onInfoClick,
          showDescriptionModal,
          theme,
          color,
          backgroundColor,
          ...tourProps,
          showTour: tourProps !== undefined,
        },
      }}
    />
  );
};

export default DatasetSelector;
