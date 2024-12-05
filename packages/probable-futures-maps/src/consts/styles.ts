import { colors, customTabletSizeForHeader, size } from "@probable-futures/lib";
import styled, { css } from "styled-components";

export const MapKeyContainer = styled.div`
  position: absolute;
  min-width: 280px;
  top: unset;
  right: 20px;
  left: 20px;
  bottom: 20px;
  z-index: 2;
  width: auto;
  font-family: LinearSans, Arial, Helvetica, sans-serif;

  @media (min-width: ${customTabletSizeForHeader}) {
    right: unset;
    min-width: 480px;
  }

  .map-key-container {
    border: 1px solid #2a172d;
    padding: 12px 18px 9px;
    background-color: #fdfdfd;
    border-bottom: 1px solid #2a172d;
  }

  .climate-zones-key-container {
    width: auto;
    overflow-x: scroll; /* Add the ability to scroll */
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    overflow-y: hidden;
    white-space: nowrap;
    padding: 10px;
    padding-left: 15px;
    border: none;
    box-sizing: content-box;
    border-top: 1px solid ${colors.darkPurple};
    border-bottom: 1px solid ${colors.darkPurple};

    @media (min-width: ${size.laptop}) {
      border: 1px solid ${colors.darkPurple};
      padding: 0px;
      padding-left: 16px;
      width: auto;
      height: 80px;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const PopupContainerCss = css`
  margin: 0;
  padding: 0;
  font-family: LinearSans, Arial, Helvetica, sans-serif;
  font-size: 16px;
  color: #2a172d;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  .mapboxgl-popup-tip {
    width: 12px;
    height: 12px;
    transform: rotate(45deg);
    background-color: ${colors.white};
    border-width: 1px !important;
    margin-bottom: -8px;
    border-left: 1px solid ${colors.darkPurple};
    border-top: 1px solid ${colors.darkPurple}!important;
    box-sizing: content-box;
  }

  .mapboxgl-popup-content {
    background-color: ${colors.white};
    border-radius: 0;
    border: 1px solid ${colors.darkPurple};
    padding: 16px 16px 0;
    box-sizing: border-box;
    box-shadow: none;
  }

  .mapboxgl-popup-close-button {
    position: absolute;
    right: 12px;
    width: 20px;
    height: 20px;
    background-repeat: no-repeat;
    background-size: 12px auto;
    background-position: center;
    font-size: 24px;
    top: 7px;
    outline: none;

    &:hover {
      background-color: transparent;
    }
  }
`;
