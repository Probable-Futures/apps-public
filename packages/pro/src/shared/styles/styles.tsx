import { StandardLonghandProperties } from "csstype";
import styled from "styled-components";

import { colors } from "../../consts";

export const modalStyle = {
  content: {
    top: "40%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -40%)",
    width: "456px",
    border: `1px solid ${colors.grey}`,
    backgroundColor: colors.primaryWhite,
    borderRadius: "0px",
    padding: "20px",
    maxWidth: "calc(100vw - 5rem)",
    maxHeight: "calc(100vh - 5rem)",
    overflowY: "auto",
    position: "relative",
  } as StandardLonghandProperties,
  overlay: { zIndex: 100 },
};

export enum Theme {
  DARK,
  LIGHT,
}

export const getDropDownStyles = (isOpen: boolean, theme: Theme) => {
  let controlBorderColor = "";
  if (theme === Theme.DARK) {
    controlBorderColor = isOpen ? colors.primaryWhite : colors.darkGrey;
  } else {
    controlBorderColor = isOpen ? colors.secondaryBlue : colors.black;
  }
  const optionColor = ({
    isDisabled,
    isSelected,
  }: {
    isDisabled: boolean;
    isSelected: boolean;
  }) => {
    if (isDisabled) {
      return colors.midGrey;
    } else if (isSelected && theme === Theme.DARK) {
      return colors.darkPurple;
    } else if (theme === Theme.DARK) {
      return colors.white;
    }
    return colors.darkPurple;
  };

  const optionBackgroundColor = ({ isSelected }: { isSelected: boolean }) => {
    if (isSelected && theme === Theme.DARK) {
      return colors.cream;
    } else if (theme === Theme.DARK) {
      return colors.secondaryBlack;
    }
    return "transparent";
  };

  return {
    option: (provided: any, state: { isSelected: boolean; isDisabled: boolean }) => ({
      ...provided,
      fontFamily: "LinearSans",
      fontSize: "14px",
      cursor: "pointer",
      color: optionColor({ ...state }),
      backgroundColor: optionBackgroundColor({ ...state }),
      padding: theme === Theme.DARK ? "8px 12px" : "8px 24px",
      pointerEvents: state.isDisabled ? "none" : "auto",
      ":hover": {
        backgroundColor: Theme.DARK ? colors.darkGrey : colors.cream,
        color: Theme.DARK ? colors.white : colors.secondaryBlack,
      },
      ":active": {
        color: `${colors.white} !important`,
      },
    }),
    control: () => ({
      display: "flex",
      outlineColor: colors.purple,
      borderWidth: isOpen ? "1px 1px 0 1px" : "1px",
      padding: "0",
      fontFamily: "LinearSans",
      fontSize: "14px",
      letterSpacing: 0,
      lineHeight: 1.3,
      cursor: "pointer",
      minHeight: "36px",
      border: `1px solid ${controlBorderColor}`,
      backgroundColor: theme === Theme.DARK ? colors.secondaryBlack : colors.white,
      color: "#000",
    }),
    input: (provided: any) => ({ ...provided, margin: 0 }),
    singleValue: (provided: any, state: { isDisabled: boolean }) => ({
      ...provided,
      color: state.isDisabled
        ? colors.midGrey
        : theme === Theme.DARK
        ? colors.white
        : colors.darkPurple,
      marginLeft: "0px",
      top: "45%",
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      minHeight: "34px",
      padding: "10px 8px",
      boxSizing: "border-box",
    }),
    menu: (provided: any) => ({
      ...provided,
      marginTop: 0,
      borderRadius: 0,
      border: `1px solid ${theme === Theme.DARK ? colors.darkGrey : colors.black} `,
      backgroundColor: theme === Theme.DARK ? colors.secondaryBlack : colors.white,
      borderTopColor: theme === Theme.DARK ? "" : "#D8D8D8",
      boxShadow: "none",
      zIndex: "5",
      fontFamily: "LinearSans",
      maxHeight: 181,
    }),
    menuList: (provided: any) => ({
      ...provided,
      maxHeight: 176,
    }),
    indicatorSeparator: () => ({ display: "none" }),
    multiValueLabel: (base: any) => ({
      ...base,
      backgroundColor: colors.white,
      color: colors.black,
      fontSize: "14px",
      lineHeight: "16px",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      display: "none",
    }),
    clearIndicator: () => ({
      display: "none",
    }),
    group: () => ({
      fontFamily: "LinearSans",
      borderTop: "1px solid #7f7f7f",
      padding: "15px 0px",
      "&:first-of-type": {
        borderTop: "none",
      },
    }),
    groupHeading: (provided: any) => ({
      ...provided,
      span: {
        color: (theme === Theme.DARK ? colors.white : colors.darkPurple) + "!important",
      },
    }),
  };
};

export const StyledRadioLabel = styled.label`
  display: block;
  position: relative;
  padding-left: 35px;
  margin-bottom: 12px;
  color: ${colors.secondaryBlack};
  cursor: pointer;
  font-size: 14px;
  user-select: none;

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  span {
    position: absolute;
    top: -2px;
    left: 0;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    border: 1px solid ${colors.darkPurple};
    padding: 1px;
  }

  :hover {
    opacity: 0.8;
  }

  span:after {
    content: "";
    position: absolute;
    display: none;
  }

  input:checked ~ span:after {
    display: block;
    position: relative;
  }

  span:after {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #006cc9;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

export const TabTitle = styled.div`
  height: 28px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 24px;
  letter-spacing: 0;
  line-height: 28px;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  background: ${colors.secondaryBlack};
  z-index: 1000;
  padding-bottom: 40px;
`;
