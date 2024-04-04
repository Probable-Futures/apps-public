import { RefObject } from "react";
import { MapRef } from "react-map-gl";
import styled, { css } from "styled-components";
import { size, colors, RecentlySearchedItemsKey } from "@probable-futures/lib/src/consts";

import { ReactComponent as CancelIcon } from "../assets/icons/cancel.svg";
import useGeocoder, { Feature } from "../hooks/useGeocoder";
import Spinner from "./Spinner";
import { ItemHoverStyles } from "../styles";

export type GeocoderProps = {
  mapRef: RefObject<MapRef>;
  mapboxAccessToken?: string;
  searchInputHeight: string;
  serverErrorText: string;
  noResultText: string;
  placeholderText: string;
  clearText: string;
  recentlySearchedText: string;
  searchIsOpen: boolean;
  localStorageRecentlySearchedIemskey: RecentlySearchedItemsKey;
  top: string;
  language?: string;
  onFly?: (arg: Feature) => void;
  setSearchIsOpen: (arg: boolean) => void;
};

export type RecentlySearchedItemType = string | Feature;

const textStyles = css`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  box-sizing: border-box;
  line-height: 20px;
`;

const Container = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  font-size: 18px;
  z-index: 5;
  background: ${colors.secondaryWhite};
  height: 100%;
  animation: fade 0.2s ease-out;

  @media (min-width: ${size.laptop}) {
    animation: slide-right-left 0.2s forwards;
    top: ${({ top }: { top: string }) => top};
    width: 0;
    overflow: hidden;
    height: unset;
    right: 80px;

    &::after,
    &::before {
      content: "";
      display: block;
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
      top: 2.5px;
      border-width: 15px;
    }

    &::before {
      border-color: transparent transparent transparent ${colors.darkPurple};
      right: -25px;
      z-index: -1;
    }

    &::after {
      border-color: transparent transparent transparent ${colors.whiteOriginal};
      right: -24px;
      z-index: 1;
    }
  }

  @keyframes fade {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes slide-right-left {
    from {
      width: 0;
    }
    to {
      width: 337px;
      overflow: visible;
    }
  }
`;

const CancelIconWrapper = styled.div`
  cursor: pointer;
  display: flex;

  svg {
    width: 25px;
    height: 25px;

    path {
      fill: ${colors.darkPurple};
    }
  }

  @media (min-width: ${size.laptop}) {
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const InputFieldButtons = styled.div`
  position: absolute;
  display: flex;
  z-index: 2;
  gap: 10px;
  align-items: center;
  height: ${({ searchInputHeight }: { searchInputHeight: string }) => searchInputHeight};
  right: 50px;
  top: 25px;

  @media (min-width: ${size.laptop}) {
    right: 10px;
    top: 0;
  }
`;

const Clear = styled.div`
  font-size: 10px;
  font-weight: 600;
  line-height: 12px;
  text-transform: uppercase;
  color: ${colors.primaryGray};
  cursor: pointer;
`;

const Separator = styled.div`
  width: 1px;
  height: 50%;
  background: ${colors.grey};
`;

const RecentlySearched = styled.div`
  background: ${colors.secondaryWhite};
  margin: 0;
  box-sizing: border-box;
  width: 100%;
  border: none;
  padding: 0px 26px 14px;

  @media (min-width: ${size.laptop}) {
    border: 1px solid ${colors.dimBlack};
    border-top: none;
    padding: 0;
  }
`;

const RecentlySearchedTitle = styled.div`
  font-size: 10px;
  font-weight: 600;
  line-height: 12px;
  text-transform: uppercase;
  color: ${colors.primaryGray};
  padding: 10px 14px 7px;

  @media (min-width: ${size.laptop}) {
    padding-top: 14px;
    padding-bottom: 7px;
  }
`;

const RecentlySearchedItem = styled.div`
  font-weight: 400;
  font-size: 16px;
  text-transform: capitalize;
  color: ${colors.dimBlack};
  padding: 12px 14px;
  ${textStyles};

  &:hover {
    ${ItemHoverStyles}
  }

  &:last-child {
    padding-bottom: 16px;
  }

  @media (min-width: ${size.laptop}) {
    padding: 7px 16px;

    &:last-child {
      padding-bottom: 14px;
    }
  }
`;

const MapboxGeocoder = styled.div`
  padding: 16px 31px 16px 24px;
  box-shadow: unset;

  @media (min-width: ${size.laptop}) {
    padding: 0px;
  }
`;

const Input = styled.input`
  height: 56px;
  padding: 7px 90px 7px 16px;
  border: 1px solid ${colors.dimBlack};
  font-size: 16px;
  background: ${colors.secondaryWhite};
  font-family: LinearSans;
  width: 100%;
  margin: 0;
  ${textStyles};

  &:focus {
    outline: none;
  }

  @media (min-width: ${size.laptop}) {
    height: ${({ searchInputHeight }: { searchInputHeight: string }) => searchInputHeight};
  }
`;

const Suggestions = styled.div`
  font-size: 16px;
  box-shadow: none;
  background: ${colors.secondaryWhite};
  position: relative;
  border: none;
  padding-top: 10px;
  ${({ hasRecentItems }: { hasRecentItems: boolean }) =>
    hasRecentItems &&
    ` &:after {
        content: " ";
        display: block;
        border-bottom: 0.5px solid ${colors.secondaryGray};
        margin-left: 14px;
        margin-top: 7px;
    }`}

  @media (min-width: ${size.laptop}) {
    border: 1px solid ${colors.dimBlack};
    border-top: none;
    border-radius: unset;
    padding-top: unset;
    ${({ hasRecentItems }: { hasRecentItems: boolean }) => hasRecentItems && "border-bottom: none;"}
  }
`;

const Suggestion = styled.div`
  box-sizing: border-box;
  padding: 8px 16px;
  ${({ isActive }: { isActive: boolean }) => isActive && ItemHoverStyles}

  &:hover {
    ${ItemHoverStyles}
  }
`;

const SuggestionTitle = styled.div`
  ${textStyles};
  font-weight: 700;
`;

const SuggestionAddress = styled.div`
  ${textStyles};
  color: #404040;
`;

const NoDataMessage = styled.div`
  color: ${colors.grey};
  padding: 6px 12px;
  font-size: 16px;
  text-align: center;
  border: 1px solid ${colors.dimBlack};
  border-top: none;
`;

const Geocoder = (props: GeocoderProps) => {
  const {
    suggestionList,
    inputValue,
    isLoading,
    showNoResultsMessage,
    error,
    inputRef,
    onRecentlySearchedItemClick,
    onFeatureSelected,
    onInputChange,
    onClear,
    close,
    onKeyDown,
  } = useGeocoder(props);

  if (!props.searchIsOpen) {
    return null;
  }

  const recentlySearchedItems: RecentlySearchedItemType[] = JSON.parse(
    localStorage.getItem(
      props.localStorageRecentlySearchedIemskey[
        (props.language as keyof RecentlySearchedItemsKey) || "en"
      ],
    ) || "[]",
  );

  const renderItem = (feature: Feature, index: number) => {
    const placeName = feature.place_name.split(",");
    const title = placeName[0];
    const address = placeName.splice(1, placeName.length).join(",");
    return (
      <Suggestion
        isActive={index === 0}
        key={feature.place_name}
        onClick={() => onFeatureSelected(feature, recentlySearchedItems)}
      >
        <SuggestionTitle>{title}</SuggestionTitle>
        <SuggestionAddress>{address}</SuggestionAddress>
      </Suggestion>
    );
  };

  const renderNoDataMessage = () => {
    if (error) {
      return <NoDataMessage>{props.serverErrorText}</NoDataMessage>;
    } else if (showNoResultsMessage) {
      return <NoDataMessage>{props.noResultText}</NoDataMessage>;
    }
    return null;
  };

  return (
    <Container top={props.top}>
      <MapboxGeocoder>
        <div>
          <Input
            ref={inputRef}
            value={inputValue}
            placeholder={props.placeholderText}
            autoFocus
            onChange={onInputChange}
            onKeyDown={(e) => onKeyDown(e, recentlySearchedItems)}
            searchInputHeight={props.searchInputHeight}
          />
          <InputFieldButtons searchInputHeight={props.searchInputHeight}>
            {inputValue.length > 0 && <Clear onClick={onClear}>{props.clearText}</Clear>}
            <Separator></Separator>
            <CancelIconWrapper onClick={close}>
              <CancelIcon />
            </CancelIconWrapper>
            {isLoading && <Spinner />}
          </InputFieldButtons>
        </div>
        {renderNoDataMessage()}
        {suggestionList.length > 0 && (
          <Suggestions hasRecentItems={recentlySearchedItems.length > 0}>
            {suggestionList.map((feature, index) => renderItem(feature, index))}
          </Suggestions>
        )}
      </MapboxGeocoder>
      {recentlySearchedItems.length > 0 && (
        <RecentlySearched>
          <RecentlySearchedTitle>{props.recentlySearchedText}</RecentlySearchedTitle>
          {recentlySearchedItems.map((item, index) =>
            typeof item === "string" ? (
              <RecentlySearchedItem
                key={`${item}_${index}`}
                onClick={() => onRecentlySearchedItemClick(recentlySearchedItems, index)}
              >
                {item}
              </RecentlySearchedItem>
            ) : (
              <RecentlySearchedItem
                key={`${item.id || item.place_name}_${index}`}
                onClick={() => onRecentlySearchedItemClick(recentlySearchedItems, index)}
              >
                {item.place_name}
              </RecentlySearchedItem>
            ),
          )}
        </RecentlySearched>
      )}
    </Container>
  );
};

export default Geocoder;
