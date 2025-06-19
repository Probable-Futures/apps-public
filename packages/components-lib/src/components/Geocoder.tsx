import { RefObject, useEffect } from "react";
import { MapRef } from "react-map-gl";
import styled, { css } from "styled-components";
import { size, colors, RecentlySearchedItemsKey } from "@probable-futures/lib";

import { ReactComponent as CancelIcon } from "../assets/icons/cancel.svg";
import useGeocoder, { Feature } from "../hooks/useGeocoder";
import Spinner from "./Spinner";
import { ReactComponent as SearchIcon } from "@probable-futures/components-lib/src/assets/icons/search.svg";
import { ItemHoverStyles } from "../styles/commonStyles";

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
  autoFocus: boolean;
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
  line-height: 16px;
`;

const Container = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  font-size: 18px;
  z-index: 5;
  height: 100%;
  animation: fade 0.2s ease-out;
  background: ${colors.white};

  @media (min-width: ${size.laptop}) {
    animation: slide-right-left 0.2s forwards;
    top: ${({ top }: { top: string }) => top};
    overflow: hidden;
    height: unset;
    right: 10px;
    max-width: 296px;
    background: transparent;
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
    width: 20px;
    height: 20px;

    path {
      fill: ${colors.dimBlack};
      opacity: 0.7;
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
  gap: 5px;
  align-items: center;
  height: ${({ searchInputHeight }: { searchInputHeight: string }) => searchInputHeight};
  right: 50px;
  top: 16px;

  @media (min-width: ${size.laptop}) {
    right: 10px;
    top: 0;
  }
`;

const Clear = styled.div`
  font-size: 12px;
  font-family: LinearSans;
  line-height: normal;
  font-weight: 400;
  text-transform: capitalize;
  cursor: pointer;
  color: ${colors.dimBlack};
  opacity: 0.8;
`;

const RecentlySearched = styled.div<{ hasSuggestions: boolean }>`
  margin: 0;
  box-sizing: border-box;
  width: 100%;
  border: none;
`;

const RecentlySearchedTitle = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
  color: ${colors.dimBlack};
  opacity: 0.8;
  padding: 10px 13px 10px;

  @media (min-width: ${size.laptop}) {
    padding-top: 14px;
    padding-bottom: 7px;
  }
`;

const RecentlySearchedItem = styled.div`
  font-weight: 400;
  font-size: 16px;
  line-height: 16px;
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
    padding: 7px 13px;
    font-size: 12px;

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
  height: 40px;
  padding: 7px 90px 7px 13px;
  border: 1px solid ${colors.grey};
  border-radius: 6px;
  font-size: 16px;
  font-style: normal;
  line-height: 18px;
  font-weight: 400;
  background: ${colors.white};
  color: ${colors.dimBlack};
  font-family: LinearSans;
  width: 100%;
  margin: 0;
  ${textStyles};

  &:focus {
    outline: none;
  }

  ::placeholder {
    color: #1c101e66;
  }

  @media (min-width: ${size.laptop}) {
    font-size: 12px;
    height: ${({ searchInputHeight }: { searchInputHeight: string }) => searchInputHeight};
  }
`;

const Suggestions = styled.div`
  ${({ hasRecentItems }: { hasRecentItems: boolean }) =>
    hasRecentItems &&
    ` &:after {
        content: " ";
        display: block;
        border-bottom: 0.5px solid ${colors.secondaryGray};
        margin-left: 14px;
        margin-top: 7px;
    }`}
`;

const DataSection = styled.div`
  font-size: 16px;
  box-shadow: none;
  background: ${colors.white};
  position: relative;
  border: none;
  padding-top: 10px;

  @media (min-width: ${size.laptop}) {
    border: 1px solid ${colors.grey};
    margin-top: 5px;
    border-radius: 6px;
    padding-top: unset;
  }
`;

const Suggestion = styled.div`
  box-sizing: border-box;
  padding: 8px 16px;
  ${({ isActive }: { isActive: boolean }) => isActive && ItemHoverStyles}

  &:hover {
    ${ItemHoverStyles}
  }

  @media (min-width: ${size.laptop}) {
    &:first-child {
      padding-top: 12px;
    }

    &:last-child {
      padding-bottom: 10px;
    }
  }
`;

const SuggestionTitle = styled.div`
  ${textStyles};
  font-weight: 400;
  color: ${colors.dimBlack};
  font-size: 16px;
  line-height: 22px;

  @media (min-width: ${size.laptop}) {
    font-size: 12px;
    line-height: 16px;
  }
`;

const SuggestionAddress = styled.div`
  ${textStyles};
  color: ${colors.dimBlack};
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
  opacity: 0.5;

  @media (min-width: ${size.laptop}) {
    font-size: 12px;
    line-height: 16px;
  }
`;

const NoDataMessage = styled.div`
  color: ${colors.grey};
  padding: 6px 12px;
  font-size: 16px;
  text-align: center;

  &:after {
    content: " ";
    display: block;
    border-bottom: 0.5px solid ${colors.secondaryGray};
    margin-top: 7px;
    width: 90%;
    margin: 0 auto;
    padding-top: 10px;
  }
`;

const Geocoder = (props: GeocoderProps) => {
  const {
    suggestionList,
    inputValue,
    isLoading,
    showNoResultsMessage,
    error,
    inputRef,
    isInputFocused,
    onRecentlySearchedItemClick,
    onFeatureSelected,
    onInputChange,
    onClear,
    onKeyDown,
    setIsInputFocused,
  } = useGeocoder(props);

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
        onClick={() => {
          onFeatureSelected(feature, recentlySearchedItems);
          props.setSearchIsOpen(false);
        }}
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

  const onInputIconClicked = () => {
    if (isInputFocused) {
      onClear(true);
    } else {
      inputRef.current?.focus();
    }
  };

  // add shortcut for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Command (Mac) or Ctrl (Windows/Linux) key is pressed along with "K" key
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inputRef, setIsInputFocused]);

  if (!props.searchIsOpen) {
    return null;
  }

  return (
    <Container top={props.top}>
      <MapboxGeocoder>
        <div>
          <Input
            ref={inputRef}
            value={inputValue}
            placeholder={props.placeholderText}
            autoFocus={props.autoFocus}
            onFocus={() => setIsInputFocused(true)}
            onChange={onInputChange}
            onKeyDown={(e) => onKeyDown(e, recentlySearchedItems)}
            searchInputHeight={props.searchInputHeight}
          />
          <InputFieldButtons searchInputHeight={props.searchInputHeight}>
            {isLoading ? (
              <Spinner />
            ) : (
              <>
                <CancelIconWrapper
                  onClick={() => {
                    onInputIconClicked();
                    props.setSearchIsOpen(false);
                  }}
                >
                  {isInputFocused ? <CancelIcon /> : <SearchIcon />}
                </CancelIconWrapper>
                {inputValue.length > 0 && (
                  <Clear onClick={() => onClear()}>{props.clearText}</Clear>
                )}
              </>
            )}
          </InputFieldButtons>
        </div>
        {isInputFocused &&
          (error ||
            showNoResultsMessage ||
            suggestionList.length > 0 ||
            recentlySearchedItems.length > 0) && (
            <DataSection>
              {renderNoDataMessage()}
              {suggestionList.length > 0 && (
                <Suggestions hasRecentItems={recentlySearchedItems.length > 0}>
                  {suggestionList.map((feature, index) => renderItem(feature, index))}
                </Suggestions>
              )}
              {recentlySearchedItems.length > 0 && isInputFocused && (
                <RecentlySearched hasSuggestions={suggestionList.length > 0}>
                  <RecentlySearchedTitle>{props.recentlySearchedText}</RecentlySearchedTitle>
                  {recentlySearchedItems.map((item, index) =>
                    typeof item === "string" ? (
                      <RecentlySearchedItem
                        key={`${item}_${index}`}
                        onClick={() => {
                          onRecentlySearchedItemClick(recentlySearchedItems, index);
                          props.setSearchIsOpen(false);
                        }}
                      >
                        {item}
                      </RecentlySearchedItem>
                    ) : (
                      <RecentlySearchedItem
                        key={`${item.id || item.place_name}_${index}`}
                        onClick={() => {
                          onRecentlySearchedItemClick(recentlySearchedItems, index);
                          props.setSearchIsOpen(false);
                        }}
                      >
                        {item.place_name}
                      </RecentlySearchedItem>
                    ),
                  )}
                </RecentlySearched>
              )}
            </DataSection>
          )}
      </MapboxGeocoder>
    </Container>
  );
};

export default Geocoder;
